    void main() {
        try {
            RootTree tree = new RootTree();
            SchemaHashTable schemas = new SchemaHashTable();
            MorphologicalGenerator gen = new MorphologicalGenerator(tree, schemas);
    
            SimpleHttpServer server = new SimpleHttpServer(tree, schemas, gen);
            server.start(8081);  // ← port can be chosen freely

            System.out.println("Press Enter to stop the server...");
            new BufferedReader(new InputStreamReader(System.in)).readLine();
    
            server.stop();
    
        } catch (Exception e) {
            e.printStackTrace();
        }
    }