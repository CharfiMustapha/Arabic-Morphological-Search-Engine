import java.util.ArrayList;
import java.util.List;

public class SchemaHashTable {
    private static final int SIZE = 100;
    List<Schema>[] buckets = new ArrayList[SIZE];

    public SchemaHashTable() {
        for (int i = 0; i < SIZE; i++) {
            buckets[i] = new ArrayList<>();
        }
    }

    private int hash(String key) {
        return Math.abs(key.hashCode() % SIZE);
    }

    public void add(Schema schema) {
        if (search(schema.id) == null) {   // avoid duplicates
            int index = hash(schema.id);
            buckets[index].add(schema);
        }
    }

    public boolean modify(String id, String newAbstractRep) {
        Schema s = search(id);
        if (s == null) return false;

        if (newAbstractRep != null && !newAbstractRep.trim().isEmpty()) {
            s.abstractRep = newAbstractRep.trim();
            return true;
        }
        return false;
    }

    public boolean remove(String id) {
        int index = hash(id);
        return buckets[index].removeIf(s -> s.id.equals(id));
    }

    public Schema search(String id) {
        int index = hash(id);
        for (Schema s : buckets[index]) {
            if (s.id.equals(id)) return s;
        }
        return null;
    }

    public void displayAllSchemas() {
        int count = 0;
        System.out.println("\n=== List of schemas ===");
        for (List<Schema> bucket : buckets) {
            for (Schema s : bucket) {
                if (s != null) {
                    count++;
                    System.out.printf("%d. %s → %s%n", count, s.id, s.abstractRep);
                }
            }
        }
        System.out.println("Total: " + count + " schema(s)");
    }

    public int getCount() {
        int count = 0;
        for (List<Schema> bucket : buckets) count += bucket.size();
        return count;
    }
}