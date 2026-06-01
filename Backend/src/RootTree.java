import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.io.FileInputStream;
import java.io.InputStreamReader;

public class RootTree {
    RootNode root;

    // Insertion function
    public RootNode insert(RootNode node, String key) {
        if (node == null) return new RootNode(key);

        int cmp = key.compareTo(node.root);
        if (cmp < 0) {
            node.left = insert(node.left, key);
        } else if (cmp > 0) {
            node.right = insert(node.right, key);
        } else {
            return node; // Duplicate ignored
        }

        node.height = 1 + Math.max(height(node.left), height(node.right));
        int balance = getBalance(node);

        // AVL rotations
        if (balance > 1 && key.compareTo(node.left.root) < 0) {
            return rightRotate(node);
        }
        if (balance < -1 && key.compareTo(node.right.root) > 0) {
            return leftRotate(node);
        }
        if (balance > 1 && key.compareTo(node.left.root) > 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }
        if (balance < -1 && key.compareTo(node.right.root) < 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }
        return node;
    }

    private int height(RootNode node) {
        return node == null ? 0 : node.height;
    }

    private int getBalance(RootNode node) {
        return node == null ? 0 : height(node.left) - height(node.right);
    }

    private RootNode rightRotate(RootNode y) {
        RootNode x = y.left;
        RootNode T2 = x.right;
        x.right = y;
        y.left = T2;
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        return x;
    }

    private RootNode leftRotate(RootNode x) {
        RootNode y = x.right;
        RootNode T2 = y.left;
        y.left = x;
        x.right = T2;
        x.height = Math.max(height(x.left), height(x.right)) + 1;
        y.height = Math.max(height(y.left), height(y.right)) + 1;
        return y;
    }

    // Search function
    public RootNode search(RootNode node, String key) {
        if (node == null || key.equals(node.root)) return node;
        return key.compareTo(node.root) < 0 ? search(node.left, key) : search(node.right, key);
    }

    // Structured display (in-order traversal)
    public void display(RootNode node) {
        if (node != null) {
            display(node.left);
            System.out.println("Root: " + node.root);
            System.out.println("Derived words: " + node.derivedWords);
            System.out.println("Frequencies: " + node.frequencies);
            display(node.right);
        }
    }

    // Load roots from file
    public void loadFromFile(String filename) throws IOException {
        try (BufferedReader br = new BufferedReader(
                new InputStreamReader(new FileInputStream(filename), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) {
                root = insert(root, line.trim());
            }
        }
    }

    public void displayDerivedByRoot(String rootStr) {
        RootNode node = search(root, rootStr);
        if (node != null) {
            System.out.println("Derived words for " + rootStr + ": " + node.derivedWords);
            System.out.println("Frequencies: " + node.frequencies);
        }
    }

    /**
     * Adds a new triliteral root to the tree.
     * Validates length and checks existence before insertion.
     *
     * @param newRoot the new root (e.g., "كتب")
     * @return true if the root was added, false if it already existed or is invalid
     */
    public boolean addRoot(String newRoot) {
        if (newRoot == null || newRoot.trim().isEmpty()) {
            System.out.println("Error: No root provided.");
            return false;
        }

        String cleaned = newRoot.trim();

        if (cleaned.length() != 3) {
            System.out.println("Error: A triliteral root must contain exactly 3 letters. (" + cleaned + ")");
            return false;
        }

        // Check if it already exists
        if (search(root, cleaned) != null) {
            System.out.println("The root \"" + cleaned + "\" already exists in the tree.");
            return false;
        }

        // Insert
        root = insert(root, cleaned);
        System.out.println("Success: Root \"" + cleaned + "\" added to the tree.");
        return true;
    }

    /**
     * Modifies an existing root by replacing it with a new one.
     * (Deletes the old root then inserts the new one)
     *
     * @param oldRoot the current root to modify
     * @param newRoot the new value
     * @return true if modification succeeded, false otherwise
     */
    public boolean modifyRoot(String oldRoot, String newRoot) {
        if (oldRoot == null || oldRoot.trim().isEmpty() ||
                newRoot == null || newRoot.trim().isEmpty()) {
            System.out.println("Error: Root is empty or null.");
            return false;
        }

        String oldClean = oldRoot.trim();
        String newClean = newRoot.trim();

        if (newClean.length() != 3) {
            System.out.println("Error: The new root must contain exactly 3 letters.");
            return false;
        }

        // Check that old root exists
        RootNode found = search(root, oldClean);
        if (found == null) {
            System.out.println("Error: The root \"" + oldClean + "\" does not exist.");
            return false;
        }

        // Check that new root does not already exist
        if (search(root, newClean) != null) {
            System.out.println("Error: The root \"" + newClean + "\" already exists.");
            return false;
        }

        // Delete old root
        root = delete(root, oldClean);

        // Insert new root
        root = insert(root, newClean);

        System.out.println("Success: Root \"" + oldClean + "\" replaced with \"" + newClean + "\".");
        return true;
    }

    /**
     * Removes a root from the AVL tree.
     *
     * @param rootToRemove the root to remove
     * @return true if removed, false otherwise
     */
    public boolean removeRoot(String rootToRemove) {
        if (rootToRemove == null || rootToRemove.trim().isEmpty()) {
            System.out.println("Error: Root is empty or null.");
            return false;
        }

        String cleaned = rootToRemove.trim();

        RootNode found = search(root, cleaned);
        if (found == null) {
            System.out.println("The root \"" + cleaned + "\" does not exist.");
            return false;
        }

        root = delete(root, cleaned);
        System.out.println("Success: Root \"" + cleaned + "\" removed.");
        return true;
    }

    // Standard AVL deletion
    private RootNode delete(RootNode node, String key) {
        if (node == null) {
            return null;
        }

        int cmp = key.compareTo(node.root);

        if (cmp < 0) {
            node.left = delete(node.left, key);
        } else if (cmp > 0) {
            node.right = delete(node.right, key);
        } else {
            // Node found – deletion cases

            // Case 1: leaf or single child
            if (node.left == null) {
                return node.right;
            } else if (node.right == null) {
                return node.left;
            }

            // Case 2: two children – find successor (minimum of right subtree)
            RootNode successor = minValueNode(node.right);
            node.root = successor.root;

            // Delete successor
            node.right = delete(node.right, successor.root);
        }

        // Update height
        node.height = 1 + Math.max(height(node.left), height(node.right));

        // Rebalance
        int balance = getBalance(node);

        // Left Left case
        if (balance > 1 && getBalance(node.left) >= 0) {
            return rightRotate(node);
        }

        // Left Right case
        if (balance > 1 && getBalance(node.left) < 0) {
            node.left = leftRotate(node.left);
            return rightRotate(node);
        }

        // Right Right case
        if (balance < -1 && getBalance(node.right) <= 0) {
            return leftRotate(node);
        }

        // Right Left case
        if (balance < -1 && getBalance(node.right) > 0) {
            node.right = rightRotate(node.right);
            return leftRotate(node);
        }

        return node;
    }

    // Find node with smallest value (successor)
    private RootNode minValueNode(RootNode node) {
        RootNode current = node;
        while (current.left != null) {
            current = current.left;
        }
        return current;
    }

    public int getRootsCount() {
        return countNodes(root);
    }

    private int countNodes(RootNode node) {
        if (node == null) return 0;
        return 1 + countNodes(node.left) + countNodes(node.right);
    }
}