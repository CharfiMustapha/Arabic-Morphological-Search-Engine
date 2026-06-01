public class Schema {
    String id;           // e.g., "فاعل", "مفعول", "افتعل"
    String abstractRep;  // Description (optional)

    public Schema(String id, String abstractRep) {
        this.id = id;
        this.abstractRep = abstractRep;
    }
}