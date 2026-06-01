import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RootNode {
    String root; // Arabic root (e.g., "كتب")
    List<String> derivedWords = new ArrayList<>(); // List of validated derived words
    Map<String, Integer> frequencies = new HashMap<>(); // Frequency per derived word
    int height = 1; // Used for AVL balancing
    RootNode left, right;

    public RootNode(String root) {
        this.root = root;
    }

    public void addDerivedWord(String word, int increment) {
        if (word == null || word.trim().isEmpty()) {
            return;
        }

        // If the word already exists → increment its frequency
        if (derivedWords.contains(word)) {
            int currentFreq = frequencies.getOrDefault(word, 0);
            frequencies.put(word, currentFreq + increment);
        } else {
            // New word → add it with the initial frequency
            derivedWords.add(word);
            frequencies.put(word, increment);
        }
    }
}