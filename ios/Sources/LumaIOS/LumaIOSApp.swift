import SwiftUI

@main
struct LumaIOSApp: App {
    var body: some Scene {
        WindowGroup {
            RuleListView(viewModel: RuleListViewModel())
        }
    }
}
