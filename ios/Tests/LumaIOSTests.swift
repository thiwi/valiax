import XCTest
@testable import LumaIOS

final class LumaIOSTests: XCTestCase {
    func testLoadMockData() {
        let viewModel = RuleListViewModel()
        XCTAssertFalse(viewModel.rules.isEmpty, "Rules should load from mock data")
    }
}
