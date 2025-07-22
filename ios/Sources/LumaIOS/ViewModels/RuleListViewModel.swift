import Foundation
import Combine

final class RuleListViewModel: ObservableObject {
    @Published var rules: [Rule] = []

    init() {
        loadMockData()
    }

    private func loadMockData() {
        if let url = Bundle.module.url(forResource: "MockRules", withExtension: "json"),
           let data = try? Data(contentsOf: url),
           let loaded = try? JSONDecoder().decode([Rule].self, from: data) {
            self.rules = loaded
        } else {
            self.rules = [
                Rule(id: UUID(), title: "Mock Rule 1", description: "Ensure table orders has a primary key."),
                Rule(id: UUID(), title: "Mock Rule 2", description: "Column email should not be empty.")
            ]
        }
    }
}
