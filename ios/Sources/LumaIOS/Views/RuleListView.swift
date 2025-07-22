import SwiftUI

struct RuleListView: View {
    @ObservedObject var viewModel: RuleListViewModel

    var body: some View {
        NavigationView {
            List(viewModel.rules) { rule in
                NavigationLink(destination: RuleDetailView(rule: rule)) {
                    Text(rule.title)
                }
            }
            .navigationTitle("Luma Rules")
        }
    }
}

struct RuleListView_Previews: PreviewProvider {
    static var previews: some View {
        RuleListView(viewModel: RuleListViewModel())
    }
}
