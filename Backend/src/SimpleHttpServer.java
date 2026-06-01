import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

public class SimpleHttpServer {

    private final RootTree rootTree;
    private final SchemaHashTable schemaTable;
    private final MorphologicalGenerator generator;
    private HttpServer server;

    public SimpleHttpServer(RootTree rootTree, SchemaHashTable schemaTable, MorphologicalGenerator generator) {
        this.rootTree = rootTree;
        this.schemaTable = schemaTable;
        this.generator = generator;
    }

    public void start(int port) throws IOException {
        server = HttpServer.create(new InetSocketAddress(port), 0);
        System.out.println("Serveur démarré sur http://localhost:" + port);

        // Envelopper tous vos handlers avec CorsHandler
        server.createContext("/api/roots", new CorsHandler(new RootsHandler()));
        server.createContext("/api/root", new CorsHandler(new SingleRootHandler()));
        server.createContext("/api/generate", new CorsHandler(new GenerateHandler()));
        server.createContext("/api/schemas", new CorsHandler(new SchemasHandler()));
        server.createContext("/api/add-root", new CorsHandler(new AddRootHandler()));
        server.createContext("/api/add-schema", new CorsHandler(new AddSchemaHandler()));
        server.createContext("/api/modify-root", new CorsHandler(new ModifyRootHandler()));
        server.createContext("/api/remove-root", new CorsHandler(new RemoveRootHandler()));
        server.createContext("/api/modify-schema", new CorsHandler(new ModifySchemaHandler()));
        server.createContext("/api/remove-schema", new CorsHandler(new RemoveSchemaHandler()));
        server.createContext("/api/validate", new CorsHandler(new ValidateHandler()));
        server.createContext("/api/load-roots-from-file", new CorsHandler(new LoadRootsFromFileHandler()));

        server.setExecutor(null);
        server.start();
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
            System.out.println("Serveur arrêté.");
        }
    }

    // ────────────────────────────────────────────────
    // Helpers JSON simples
    // ────────────────────────────────────────────────

    private String toJsonSuccess(String message, Object data) {
        return "{\"success\":true,\"message\":\"" + escapeJson(message) + "\",\"data\":" + objToJson(data) + "}";
    }

    private String toJsonError(String message) {
        return "{\"success\":false,\"message\":\"" + escapeJson(message) + "\"}";
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private String objToJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) return "\"" + escapeJson((String) obj) + "\"";
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            return "[" + list.stream().map(this::objToJson).collect(Collectors.joining(",")) + "]";
        }
        if (obj instanceof Map) {
            Map<?, ?> map = (Map<?, ?>) obj;
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) sb.append(",");
                sb.append(objToJson(e.getKey())).append(":").append(objToJson(e.getValue()));
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }
        return "\"" + escapeJson(obj.toString()) + "\"";
    }

    // ────────────────────────────────────────────────
    // HANDLERS – tous les endpoints
    // ────────────────────────────────────────────────

    class RootsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            List<String> roots = new ArrayList<>();
            collectRoots(rootTree.root, roots);
            sendResponse(exchange, 200, toJsonSuccess("Liste des racines", roots));
        }
    }

    private void collectRoots(RootNode node, List<String> list) {
        if (node == null) return;
        collectRoots(node.left, list);
        list.add(node.root);
        collectRoots(node.right, list);
    }

    class SingleRootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String query = exchange.getRequestURI().getQuery();
            String rootStr = getQueryParam(query, "q");
            if (rootStr == null || rootStr.trim().isEmpty()) {
                sendResponse(exchange, 400, toJsonError("Paramètre ?q= requis"));
                return;
            }
            RootNode node = rootTree.search(rootTree.root, rootStr.trim());
            if (node == null) {
                sendResponse(exchange, 404, toJsonError("Racine non trouvée"));
                return;
            }
            Map<String, Object> data = new HashMap<>();
            data.put("root", node.root);
            data.put("derivedWords", node.derivedWords);
            data.put("frequencies", node.frequencies);
            sendResponse(exchange, 200, toJsonSuccess("Racine trouvée", data));
        }
    }

    class GenerateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String root = (String) req.get("root");
            @SuppressWarnings("unchecked")
            List<String> schemas = (List<String>) req.get("schemas");

            if (root == null || root.trim().length() != 3) {
                sendResponse(exchange, 400, toJsonError("Racine doit être exactement 3 lettres"));
                return;
            }
            if (schemas == null || schemas.isEmpty()) {
                sendResponse(exchange, 400, toJsonError("Liste de schémas requise"));
                return;
            }

            List<Map<String, Object>> results = new ArrayList<>();
            for (String schemaId : schemas) {
                Schema schema = schemaTable.search(schemaId.trim());
                Map<String, Object> item = new HashMap<>();
                item.put("schema", schemaId);
                if (schema == null) {
                    item.put("status", "error");
                    item.put("message", "Schème inexistant");
                    results.add(item);
                    continue;
                }
                String word = generator.generateWord(root.trim(), schemaId.trim());
                if (word != null) {
                    RootNode node = rootTree.search(rootTree.root, root.trim());
                    if (node != null) node.addDerivedWord(word, 1);
                    item.put("status", "success");
                    item.put("generatedWord", word);
                    item.put("schemaDescription", schema.abstractRep != null ? schema.abstractRep : "");
                } else {
                    item.put("status", "error");
                    item.put("message", "Échec de génération");
                }
                results.add(item);
            }
            sendResponse(exchange, 200, toJsonSuccess("Génération terminée", results));
        }
    }

    class SchemasHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"GET".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            List<Map<String, String>> list = new ArrayList<>();
            for (List<Schema> bucket : schemaTable.buckets) {
                for (Schema s : bucket) {
                    Map<String, String> m = new HashMap<>();
                    m.put("id", s.id);
                    m.put("description", s.abstractRep != null ? s.abstractRep : "");
                    list.add(m);
                }
            }
            sendResponse(exchange, 200, toJsonSuccess("Liste des schémas", list));
        }
    }

    class AddRootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String newRoot = (String) req.get("root");
            if (newRoot == null || newRoot.trim().length() != 3) {
                sendResponse(exchange, 400, toJsonError("Racine doit contenir exactement 3 lettres"));
                return;
            }
            boolean ok = rootTree.addRoot(newRoot.trim());
            if (ok) {
                sendResponse(exchange, 200, toJsonSuccess("Racine ajoutée", newRoot.trim()));
            } else {
                sendResponse(exchange, 400, toJsonError("Échec ajout (existe déjà ?)"));
            }
        }
    }

    class AddSchemaHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String id = (String) req.get("id");
            String desc = (String) req.get("description");
            if (id == null || id.trim().isEmpty()) {
                sendResponse(exchange, 400, toJsonError("ID schème requis"));
                return;
            }
            if (schemaTable.search(id.trim()) != null) {
                sendResponse(exchange, 409, toJsonError("Schème existe déjà"));
                return;
            }
            schemaTable.add(new Schema(id.trim(), desc != null ? desc.trim() : ""));
            sendResponse(exchange, 200, toJsonSuccess("Schème ajouté", id.trim()));
        }
    }

    class ModifyRootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String oldRoot = (String) req.get("old");
            String newRoot = (String) req.get("new");
            if (oldRoot == null || newRoot == null ||
                    oldRoot.trim().length() != 3 || newRoot.trim().length() != 3) {
                sendResponse(exchange, 400, toJsonError("Les deux racines doivent contenir exactement 3 lettres"));
                return;
            }
            boolean ok = rootTree.modifyRoot(oldRoot.trim(), newRoot.trim());
            if (ok) {
                sendResponse(exchange, 200, toJsonSuccess("Racine modifiée", newRoot.trim()));
            } else {
                sendResponse(exchange, 400, toJsonError("Échec modification"));
            }
        }
    }

    class RemoveRootHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String rootToRemove = (String) req.get("root");
            if (rootToRemove == null || rootToRemove.trim().length() != 3) {
                sendResponse(exchange, 400, toJsonError("Racine à supprimer doit contenir 3 lettres"));
                return;
            }
            boolean ok = rootTree.removeRoot(rootToRemove.trim());
            if (ok) {
                sendResponse(exchange, 200, toJsonSuccess("Racine supprimée", rootToRemove.trim()));
            } else {
                sendResponse(exchange, 404, toJsonError("Racine non trouvée"));
            }
        }
    }

    class ModifySchemaHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String id = (String) req.get("id");
            String newDesc = (String) req.get("description");
            if (id == null || id.trim().isEmpty()) {
                sendResponse(exchange, 400, toJsonError("ID du schéma requis"));
                return;
            }
            boolean changed = schemaTable.modify(id.trim(), newDesc != null ? newDesc.trim() : null);
            if (changed) {
                sendResponse(exchange, 200, toJsonSuccess("Description modifiée", id.trim()));
            } else {
                sendResponse(exchange, 400, toJsonError("Échec modification (schéma inexistant ou description invalide)"));
            }
        }
    }

    class RemoveSchemaHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String id = (String) req.get("id");
            if (id == null || id.trim().isEmpty()) {
                sendResponse(exchange, 400, toJsonError("ID du schéma requis"));
                return;
            }
            boolean removed = schemaTable.remove(id.trim());
            if (removed) {
                sendResponse(exchange, 200, toJsonSuccess("Schéma supprimé", id.trim()));
            } else {
                sendResponse(exchange, 404, toJsonError("Schéma non trouvé"));
            }
        }
    }

    class ValidateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String word = (String) req.get("word");
            String root = (String) req.get("root");
            if (word == null || word.trim().isEmpty() || root == null || root.trim().length() != 3) {
                sendResponse(exchange, 400, toJsonError("Mot et racine (3 lettres) requis"));
                return;
            }

            // CHANGEMENT: Utiliser la nouvelle méthode qui retourne le schème
            String schema = generator.findSchemaForWord(word.trim(), root.trim());
            boolean valid = schema != null;

            Map<String, Object> data = new HashMap<>();
            data.put("word", word.trim());
            data.put("root", root.trim());
            data.put("isValid", valid);
            data.put("schema", schema); // AJOUT: inclusion du schème dans la réponse

            sendResponse(exchange, 200, toJsonSuccess(
                    valid ? "Le mot appartient à la racine" : "Le mot n'appartient PAS à cette racine",
                    data
            ));
        }
    }

    class LoadRootsFromFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (!"POST".equals(exchange.getRequestMethod())) {
                sendResponse(exchange, 405, toJsonError("Méthode non autorisée – utilisez POST"));
                return;
            }
            String body = readBody(exchange);
            Map<String, Object> req = parseSimpleJson(body);
            String filename = (String) req.get("filename");
            if (filename == null || filename.trim().isEmpty()) {
                sendResponse(exchange, 400, toJsonError("Le champ 'filename' est obligatoire"));
                return;
            }
            String requestedFile = filename.trim();
            if (requestedFile.contains("..") || requestedFile.contains("/") ||
                    requestedFile.contains("\\") || requestedFile.contains(":")) {
                sendResponse(exchange, 400, toJsonError("Nom de fichier invalide (caractères interdits)"));
                return;
            }
            if (!requestedFile.toLowerCase().endsWith(".txt")) {
                sendResponse(exchange, 400, toJsonError("Seuls les fichiers .txt sont autorisés"));
                return;
            }
            String fullPath = requestedFile; // ou "data/" + requestedFile si tu veux un dossier fixe

            int countBefore = rootTree.getRootsCount(); // suppose que tu as ajouté cette méthode

            try {
                rootTree.loadFromFile(fullPath);
                int countAfter = rootTree.getRootsCount();
                int added = countAfter - countBefore;

                Map<String, Object> data = new HashMap<>();
                data.put("filename", fullPath);
                data.put("rootsBefore", countBefore);
                data.put("rootsAfter", countAfter);
                data.put("rootsAdded", added > 0 ? added : 0);

                sendResponse(exchange, 200, toJsonSuccess(
                        "Fichier chargé – " + added + " racine(s) ajoutée(s)",
                        data
                ));
            } catch (FileNotFoundException e) {
                sendResponse(exchange, 404, toJsonError("Fichier non trouvé : " + fullPath));
            } catch (IOException e) {
                sendResponse(exchange, 500, toJsonError("Erreur de lecture : " + e.getMessage()));
            } catch (Exception e) {
                sendResponse(exchange, 500, toJsonError("Erreur inattendue : " + e.getMessage()));
            }
        }
    }

    // ────────────────────────────────────────────────
    // Utilitaires HTTP
    // ────────────────────────────────────────────────

    private void sendResponse(HttpExchange exchange, int code, String response) throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody();
             BufferedReader reader = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining());
        }
    }

    private Map<String, Object> parseSimpleJson(String json) {
        Map<String, Object> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;
        json = json.trim();
        if (!json.startsWith("{") || !json.endsWith("}")) return map;
        json = json.substring(1, json.length() - 1).trim();
        String[] pairs = json.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (String pair : pairs) {
            String[] kv = pair.split(":(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)", 2);
            if (kv.length != 2) continue;
            String key = kv[0].trim().replace("\"", "");
            String value = kv[1].trim();
            if (value.startsWith("\"") && value.endsWith("\"")) {
                map.put(key, value.substring(1, value.length() - 1));
            } else if (value.startsWith("[") && value.endsWith("]")) {
                String inner = value.substring(1, value.length() - 1);
                List<String> list = Arrays.stream(inner.split(","))
                        .map(s -> s.trim().replace("\"", ""))
                        .collect(Collectors.toList());
                map.put(key, list);
            } else {
                map.put(key, value);
            }
        }
        return map;
    }

    private String getQueryParam(String query, String param) {
        if (query == null) return null;
        for (String pair : query.split("&")) {
            String[] kv = pair.split("=");
            if (kv.length == 2 && kv[0].equals(param)) {
                return java.net.URLDecoder.decode(kv[1], StandardCharsets.UTF_8);
            }
        }
        return null;
    }
}