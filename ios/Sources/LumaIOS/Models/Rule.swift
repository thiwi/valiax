import Foundation

struct Rule: Identifiable, Decodable {
    let id: UUID
    let title: String
    let description: String
}
