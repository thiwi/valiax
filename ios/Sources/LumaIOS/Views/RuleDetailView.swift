import SwiftUI

struct RuleDetailView: View {
    let rule: Rule

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(rule.title)
                .font(.title)
            Text(rule.description)
            Spacer()
        }
        .padding()
        .navigationTitle("Detail")
    }
}

struct RuleDetailView_Previews: PreviewProvider {
    static var previews: some View {
        RuleDetailView(rule: Rule(id: UUID(), title: "Rule", description: "Description"))
    }
}
