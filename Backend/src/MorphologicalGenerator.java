import java.util.ArrayList;
import java.util.List;

public class MorphologicalGenerator {
    private final RootTree rootTree;
    private final SchemaHashTable schemaTable;

    public MorphologicalGenerator(RootTree rootTree, SchemaHashTable schemaTable) {
        this.rootTree = rootTree;
        this.schemaTable = schemaTable;
    }

    // Generate a derived word
    public String generateWord(String root, String schemaId) {
        if (root == null || root.length() != 3) {
            return null;
        }

        char r1 = root.charAt(0);   // First root letter (ف position)
        char r2 = root.charAt(1);   // Second root letter (ع position)
        char r3 = root.charAt(2);   // Third root letter (ل position)

        String pattern = schemaId;

        // General substitution: ف → r1, ع → r2, ل → r3
        pattern = pattern.replace('ف', r1);
        pattern = pattern.replace('ع', r2);
        pattern = pattern.replace('ل', r3);

        return pattern;
    }

    // Generate and display derived words for a root and a list of schemas
    public void generateAndDisplay(String rootStr, List<String> schemaIds) {
        RootNode rootNode = rootTree.search(rootTree.root, rootStr);
        if (rootNode == null) {
            System.out.println("Root not found: " + rootStr);
            return;
        }

        // Keep track of whether at least one schema worked successfully
        boolean atLeastOneSuccess = false;

        for (String schemaId : schemaIds) {
            Schema schema = schemaTable.search(schemaId.trim());  // ← explicit search

            if (schema == null) {
                System.out.println("Error: The schema \"" + schemaId.trim() + "\" does not exist.");
                continue;  // move to the next schema without stopping the loop
            }

            String word = generateWord(rootStr, schemaId);
            if (word != null) {
                System.out.println("Root: " + rootStr);
                System.out.println("Schema: " + schemaId);
                System.out.println("Generated word: " + word);
                rootNode.addDerivedWord(word, 1);
                atLeastOneSuccess = true;
            } else {
                System.out.println("Generation failed for schema \"" + schemaId + "\" (check the rule or the root).");
            }
        }

        if (!atLeastOneSuccess && !schemaIds.isEmpty()) {
            System.out.println("\nNo word could be generated. Please verify the entered schemas.");
        }
    }

    public String findSchemaForWord(String word, String rootStr) {
        if (rootStr.length() != 3) {
            System.out.println("Error: The root must contain exactly 3 letters.");
            return null;
        }

        for (Schema schema : getAllSchemas()) {
            String generated = generateWord(rootStr, schema.id);
            if (generated != null && generated.equals(word)) {
                System.out.println("YES, Schema: " + schema.id);
                return schema.id;
            }
        }
        System.out.println("NO");
        return null;
    }

    private List<Schema> getAllSchemas() {
        List<Schema> all = new ArrayList<>();
        for (List<Schema> bucket : schemaTable.buckets) {
            all.addAll(bucket);
        }
        return all;
    }
}