// Native macOS window for the edge AI launcher (scripts/launcher.mjs).
// Built by scripts/make-launcher-app.sh. The start/stop logic lives only in
// launcher.mjs; this app runs it in the background (if it is not already
// running), shows its status, and stops it again on quit. Gemma, the hub and the
// tunnel keep running after quit until "Stop everything" is pressed.

import AppKit
import SwiftUI

struct Part: Decodable, Identifiable {
  let label: String
  let ok: Bool
  let detail: String
  var id: String { label }
}

struct Step: Decodable, Identifiable {
  let label: String
  let state: String
  let detail: String
  var id: String { label }
}

struct TestResult: Decodable {
  let ok: Bool
  let ms: Int
  let text: String
}

struct LauncherStatus: Decodable {
  let busy: Bool
  let parts: [Part]
  let steps: [Step]
  let test: TestResult?
}

@MainActor
final class Engine: ObservableObject {
  @Published var status: LauncherStatus?
  @Published var problem: String?
  private var child: Process?
  private var timer: Timer?
  private let base = URL(string: "http://127.0.0.1:8700")!

  func boot() {
    guard timer == nil else { return }
    Task {
      if await refresh() == nil { startEngine() }
      timer = Timer.scheduledTimer(withTimeInterval: 1.5, repeats: true) { _ in
        Task { @MainActor in _ = await self.refresh() }
      }
    }
  }

  private func startEngine() {
    let info = Bundle.main.infoDictionary ?? [:]
    guard let repo = info["EdgeRepo"] as? String, let node = info["EdgeNode"] as? String else {
      problem = "This app was built without the repo path. Run scripts/make-launcher-app.sh again."
      return
    }
    let process = Process()
    process.executableURL = URL(fileURLWithPath: node)
    process.arguments = ["scripts/launcher.mjs"]
    process.currentDirectoryURL = URL(fileURLWithPath: repo)
    process.standardOutput = FileHandle.nullDevice
    process.standardError = FileHandle.nullDevice
    do {
      try process.run()
      child = process
    } catch {
      problem = "Could not start Node at \(node): \(error.localizedDescription)"
    }
  }

  @discardableResult
  func refresh() async -> LauncherStatus? {
    do {
      let (data, _) = try await URLSession.shared.data(from: base.appendingPathComponent("status"))
      let next = try JSONDecoder().decode(LauncherStatus.self, from: data)
      status = next
      problem = nil
      return next
    } catch {
      return nil
    }
  }

  func send(_ path: String) {
    var request = URLRequest(url: base.appendingPathComponent(path))
    request.httpMethod = "POST"
    Task {
      _ = try? await URLSession.shared.data(for: request)
      await refresh()
    }
  }

  func shutdown() {
    child?.terminate()
  }

  var ready: Bool {
    guard let status, !status.busy else { return false }
    return status.parts.allSatisfy(\.ok)
  }
}

// --- look --------------------------------------------------------------------
extension Color {
  static let ink = Color(red: 0.23, green: 0.18, blue: 0.16)
  static let cream = Color(red: 0.98, green: 0.95, blue: 0.85)
  static let card = Color(red: 1.0, green: 0.98, blue: 0.94)
  static let note = Color(red: 1.0, green: 0.97, blue: 0.80)
  static let okGreen = Color(red: 0.25, green: 0.70, blue: 0.50)
  static let waitYellow = Color(red: 0.97, green: 0.82, blue: 0.42)
  static let offRose = Color(red: 0.96, green: 0.76, blue: 0.82)
}

struct BigButtonStyle: ButtonStyle {
  let ready: Bool
  func makeBody(configuration: Configuration) -> some View {
    let top = ready ? Color(red: 0.72, green: 0.94, blue: 0.83) : Color(red: 1.0, green: 0.55, blue: 0.56)
    let bottom = ready ? Color(red: 0.14, green: 0.47, blue: 0.31) : Color(red: 0.71, green: 0.15, blue: 0.17)
    let pressed = configuration.isPressed
    return ZStack {
      Circle().fill(Color.ink).offset(y: pressed ? 2 : 12)
      Circle()
        .fill(RadialGradient(colors: [top, bottom], center: UnitPoint(x: 0.35, y: 0.3), startRadius: 4, endRadius: 150))
        .overlay(Circle().stroke(Color.ink, lineWidth: 6))
        .offset(y: pressed ? 10 : 0)
      configuration.label
        .font(.system(size: 30, weight: .black, design: .rounded))
        .foregroundStyle(.white)
        .offset(y: pressed ? 10 : 0)
    }
    .frame(width: 220, height: 232)
    .animation(.easeOut(duration: 0.08), value: pressed)
  }
}

struct Row: View {
  let color: Color
  let label: String
  let detail: String
  var pulsing = false
  @State private var dim = false

  var body: some View {
    HStack(alignment: .top, spacing: 10) {
      Circle().fill(color).overlay(Circle().stroke(Color.ink, lineWidth: 2))
        .frame(width: 14, height: 14).padding(.top, 3)
        .opacity(pulsing && dim ? 0.35 : 1)
        .onAppear { if pulsing { withAnimation(.easeInOut(duration: 0.6).repeatForever()) { dim = true } } }
      VStack(alignment: .leading, spacing: 2) {
        Text(label).font(.system(size: 15, weight: .bold, design: .rounded))
        if !detail.isEmpty {
          Text(detail).font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.65))
            .textSelection(.enabled)
        }
      }
      Spacer(minLength: 0)
    }
    .padding(.horizontal, 14).padding(.vertical, 10)
    // The first background sits nearest the content: card first, then the hard shadow.
    .background(RoundedRectangle(cornerRadius: 16).fill(Color.card))
    .background(RoundedRectangle(cornerRadius: 16).fill(Color.ink).offset(x: 3, y: 3))
    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.ink, lineWidth: 2.5))
  }
}

struct ContentView: View {
  @EnvironmentObject var engine: Engine
  @State private var confirmStop = false

  private var title: String {
    guard let status = engine.status else { return "…" }
    return status.busy ? "STARTING…" : engine.ready ? "READY" : "START"
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        VStack(spacing: 4) {
          Text("Edge AI").font(.system(size: 30, weight: .heavy, design: .rounded))
          Text("Gemma 4 E2B on this Mac, for the app and the phones")
            .font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.7))
        }
        Button(title) { engine.send("start") }
          .buttonStyle(BigButtonStyle(ready: engine.ready))
          .disabled(engine.status == nil || engine.status?.busy == true)
          .padding(.vertical, 6)

        if let problem = engine.problem {
          Text(problem).font(.system(size: 13, weight: .semibold)).foregroundStyle(.red)
        }

        if let test = engine.status?.test {
          VStack(alignment: .leading, spacing: 4) {
            Text(test.ok ? "Gemma answered" : "No answer").font(.system(size: 15, weight: .heavy, design: .rounded))
            Text(test.text).font(.system(size: 14, weight: .medium, design: .rounded)).textSelection(.enabled)
          }
          .frame(maxWidth: .infinity, alignment: .leading)
          .padding(14)
          .background(RoundedRectangle(cornerRadius: 16).fill(Color.note))
          .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.ink, lineWidth: 2.5))
        }

        section("Status") {
          ForEach(engine.status?.parts ?? []) { part in
            Row(color: part.ok ? .okGreen : .offRose, label: part.label, detail: part.detail)
          }
        }

        if let steps = engine.status?.steps, !steps.isEmpty {
          section("Last run") {
            ForEach(steps) { step in
              Row(
                color: step.state == "ok" ? .okGreen : step.state == "running" ? .waitYellow : .offRose,
                label: step.label, detail: step.detail, pulsing: step.state == "running")
            }
          }
        }

        Button("Stop everything") { confirmStop = true }
          .buttonStyle(.bordered)
          .disabled(engine.status == nil || engine.status?.busy == true)
          .confirmationDialog("Stop Gemma, the hub and the tunnel?", isPresented: $confirmStop) {
            Button("Stop everything", role: .destructive) { engine.send("stop") }
          } message: {
            Text("Phones will lose the AI until you press START again.")
          }
          .padding(.top, 6)
      }
      .padding(24)
      .foregroundStyle(Color.ink)
    }
    .frame(minWidth: 440, idealWidth: 460, minHeight: 640, idealHeight: 820)
    .background(Color.cream)
    .onAppear { engine.boot() }
  }

  @ViewBuilder
  private func section<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      Text(title).font(.system(size: 15, weight: .heavy, design: .rounded))
      content()
    }
    .frame(maxWidth: .infinity, alignment: .leading)
  }
}

final class AppDelegate: NSObject, NSApplicationDelegate {
  var engine: Engine?
  func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
  func applicationWillTerminate(_ notification: Notification) {
    MainActor.assumeIsolated { engine?.shutdown() }
  }
}

@main
struct EdgeLauncherApp: App {
  @NSApplicationDelegateAdaptor(AppDelegate.self) private var delegate
  @StateObject private var engine = Engine()

  var body: some Scene {
    Window("Edge AI Launcher", id: "main") {
      ContentView()
        .environmentObject(engine)
        .preferredColorScheme(.light) // the cream design; keeps the title readable in dark mode
        .onAppear { delegate.engine = engine }
    }
    .windowResizability(.contentMinSize)
  }
}
