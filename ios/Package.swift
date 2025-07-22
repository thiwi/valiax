// swift-tools-version: 6.1
import PackageDescription

let package = Package(
    name: "LumaIOS",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .library(name: "LumaIOS", targets: ["LumaIOS"])
    ],
    targets: [
        .target(
            name: "LumaIOS",
            path: "Sources/LumaIOS",
            resources: [
                .process("Data/MockRules.json")
            ]
        ),
        .testTarget(
            name: "LumaIOSTests",
            dependencies: ["LumaIOS"],
            path: "Tests"
        )
    ]
)
