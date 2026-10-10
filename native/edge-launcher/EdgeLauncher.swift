// Native macOS window for the edge AI launcher (scripts/launcher.mjs).
// Built by scripts/make-launcher-app.sh. The start/stop logic lives only in
// launcher.mjs; this app runs it in the background (if it is not already
// running), shows its status, and stops it again on quit. Gemma, the hub and the
// tunnel keep running after quit until STOP is pressed.

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

struct TunnelInfo: Decodable, Equatable {
  let running: Bool
  let url: String?
  let reachable: Bool? // nil while the first check through the public URL runs
  let ms: Int?
  let checkedAgoS: Int?
  let problem: String
  let requests: Int
  let openConns: Int
}

// One feature card from scripts/launcher-checks.mjs. state: ok, warn, fail, running, info, idle.
struct HealthRow: Decodable, Identifiable {
  let state: String
  let label: String
  let detail: String
  var id: String { label }
}

struct ChartSeries: Decodable, Identifiable {
  let label: String
  let values: [Double]
  var id: String { label }
}

struct HealthChart: Decodable {
  let max: Double
  let unit: String
  let series: [ChartSeries]
}

struct HealthSection: Decodable, Identifiable {
  let title: String
  let note: String?
  let rows: [HealthRow]
  let chart: HealthChart?
  var id: String { title }
}

struct LiveState: Decodable {
  let running: Bool
  let at: Double? // ms since 1970 of the last finished live check
}

struct LauncherStatus: Decodable {
  let busy: Bool
  let action: String? // "start" or "stop" while busy; missing from older engines
  let tunnel: TunnelInfo? // missing from older engines
  let parts: [Part]
  let steps: [Step]
  let test: TestResult?
  let sections: [HealthSection]? // missing from older engines
  let live: LiveState?
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

  private static func isRepo(_ path: String) -> Bool {
    FileManager.default.fileExists(atPath: (path as NSString).appendingPathComponent("scripts/launcher.mjs"))
  }

  // The downloadable build (GitHub Release) was made on another Mac, so the paths
  // baked into Info.plist may not exist here. Look for the clone, then ask once.
  private func findRepo(baked: String?) -> String? {
    if let baked, Self.isRepo(baked) { return baked }
    if let saved = UserDefaults.standard.string(forKey: "EdgeRepo"), Self.isRepo(saved) { return saved }
    // A downloaded app may run from a translocated copy, so walking up from the
    // bundle only helps when the app was moved next to or into the clone.
    var dir = Bundle.main.bundleURL.deletingLastPathComponent()
    for _ in 0..<4 {
      for candidate in [dir.path, dir.appendingPathComponent("modes").path] where Self.isRepo(candidate) {
        return candidate
      }
      dir = dir.deletingLastPathComponent()
    }
    let home = FileManager.default.homeDirectoryForCurrentUser
    for sub in ["modes", "Desktop/modes", "Downloads/modes", "Documents/modes", "Developer/modes", "Projects/modes", "GitHub/modes"] {
      let candidate = home.appendingPathComponent(sub).path
      if Self.isRepo(candidate) { return candidate }
    }
    let panel = NSOpenPanel()
    panel.canChooseDirectories = true
    panel.canChooseFiles = false
    panel.message = "Choose your clone of github.com/appbuildersph/modes (the SIBOL repository)"
    panel.prompt = "Use this folder"
    guard panel.runModal() == .OK, let url = panel.url, Self.isRepo(url.path) else { return nil }
    UserDefaults.standard.set(url.path, forKey: "EdgeRepo")
    return url.path
  }

  private func findNode(baked: String?) -> String? {
    let fm = FileManager.default
    for candidate in [baked, "/opt/homebrew/bin/node", "/usr/local/bin/node"].compactMap({ $0 }) where fm.isExecutableFile(atPath: candidate) {
      return candidate
    }
    // nvm and similar installs only show up on the login shell's PATH.
    let shell = Process()
    let pipe = Pipe()
    shell.executableURL = URL(fileURLWithPath: "/bin/zsh")
    shell.arguments = ["-lic", "command -v node"]
    shell.standardOutput = pipe
    shell.standardError = FileHandle.nullDevice
    guard (try? shell.run()) != nil else { return nil }
    shell.waitUntilExit()
    let out = String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
    let path = out.split(separator: "\n").last.map { String($0).trimmingCharacters(in: .whitespaces) } ?? ""
    return fm.isExecutableFile(atPath: path) ? path : nil
  }

  private func startEngine() {
    let info = Bundle.main.infoDictionary ?? [:]
    guard let repo = findRepo(baked: info["EdgeRepo"] as? String) else {
      problem = "Could not find the SIBOL repository. Clone github.com/appbuildersph/modes, run npm install, then open this app again."
      return
    }
    guard let node = findNode(baked: info["EdgeNode"] as? String) else {
      problem = "Node.js was not found. Install Node 24 from nodejs.org, then open this app again."
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

  var starting: Bool { status?.busy == true && status?.action != "stop" }
  var stopping: Bool { status?.busy == true && status?.action == "stop" }
  var anyUp: Bool { status?.parts.contains(where: \.ok) ?? false }
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
  static let failRed = Color(red: 0.90, green: 0.28, blue: 0.30)
  static let infoBlue = Color(red: 0.73, green: 0.83, blue: 0.93)
  static let checkBlue = Color(red: 0.75, green: 0.89, blue: 1.0)

  static func health(_ state: String) -> Color {
    switch state {
    case "ok": return .okGreen
    case "warn", "running": return .waitYellow
    case "fail": return .failRed
    case "info": return .infoBlue
    default: return .clear
    }
  }
}

enum Halo { case none, ripple, spin, glow }

// Animation around a round button, drawn from the clock so it starts and stops
// cleanly when the mode changes (repeatForever animations keep running after).
struct HaloView: View {
  let mode: Halo
  let color: Color
  let size: CGFloat
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  var body: some View {
    TimelineView(.animation(paused: mode == .none || reduceMotion)) { context in
      let t = context.date.timeIntervalSinceReferenceDate
      ZStack {
        switch mode {
        case .none:
          EmptyView()
        case .ripple:
          ForEach(0..<2, id: \.self) { i in
            let p = reduceMotion ? 0 : (t / 2 + Double(i) / 2).truncatingRemainder(dividingBy: 1)
            Circle().stroke(color, lineWidth: 4)
              .frame(width: size + 12, height: size + 12)
              .scaleEffect(1 + 0.4 * p)
              .opacity(0.6 * (1 - p))
          }
        case .spin:
          Circle().stroke(color.opacity(0.25), lineWidth: 7).frame(width: size + 30, height: size + 30)
          Circle().trim(from: 0, to: 0.3)
            .stroke(color, style: StrokeStyle(lineWidth: 7, lineCap: .round))
            .frame(width: size + 30, height: size + 30)
            .rotationEffect(.degrees(reduceMotion ? 0 : (t * 400).truncatingRemainder(dividingBy: 360)))
        case .glow:
          Circle().fill(color)
            .frame(width: size, height: size)
            .blur(radius: 18)
            .opacity(reduceMotion ? 0.4 : 0.3 + 0.25 * sin(t * 2.6))
        }
      }
    }
    .allowsHitTesting(false)
  }
}

struct BigButtonStyle: ButtonStyle {
  let top: Color
  let bottom: Color
  var halo: Halo = .none
  var haloColor: Color = .clear
  var enabled = true
  var size: CGFloat = 168

  func makeBody(configuration: Configuration) -> some View {
    let pressed = configuration.isPressed && enabled
    return ZStack {
      HaloView(mode: halo, color: haloColor, size: size)
      Circle().fill(Color.ink).offset(y: pressed ? 2 : 12)
      Circle()
        .fill(RadialGradient(colors: [top, bottom], center: UnitPoint(x: 0.35, y: 0.3), startRadius: 4, endRadius: size * 0.7))
        .overlay(Circle().stroke(Color.ink, lineWidth: 6))
        .offset(y: pressed ? 10 : 0)
      configuration.label
        .font(.system(size: 22, weight: .black, design: .rounded))
        .foregroundStyle(.white)
        .offset(y: pressed ? 10 : 0)
    }
    .frame(width: size, height: size)
    .padding(.bottom, 12)
    .saturation(enabled || halo == .spin ? 1 : 0.35)
    .animation(.easeOut(duration: 0.08), value: pressed)
    .animation(.easeInOut(duration: 0.35), value: enabled)
  }
}

// Icon over a word; a new word pops in when the state changes.
struct ButtonFace: View {
  let icon: String?
  let text: String

  var body: some View {
    VStack(spacing: 4) {
      if let icon { Image(systemName: icon).font(.system(size: 26, weight: .black)) }
      Text(text)
    }
    .id(text)
    .transition(.scale(scale: 0.5).combined(with: .opacity))
  }
}

// The ngrok tunnel on its own card: an open tunnel is not enough, so the engine
// also pings the hub through the public URL, the way a phone would.
struct TunnelCard: View {
  let tunnel: TunnelInfo
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  private enum State { case on, wait, off }
  private var state: State {
    guard tunnel.running, tunnel.url != nil else { return .off }
    guard let reachable = tunnel.reachable else { return .wait }
    return reachable ? .on : .off
  }
  private var word: String {
    switch state {
    case .on: return "ACTIVE"
    case .wait: return "CHECKING"
    case .off: return !tunnel.running ? "NGROK OFF" : tunnel.url == nil ? "NO TUNNEL" : "NOT REACHABLE"
    }
  }
  private var tint: Color { state == .on ? .okGreen : state == .wait ? .waitYellow : .offRose }
  private var reach: String {
    guard tunnel.url != nil else { return "no" }
    guard let reachable = tunnel.reachable else { return "checking…" }
    let text = reachable ? "yes, hub answered in \(tunnel.ms ?? 0) ms" : (tunnel.problem.isEmpty ? "no" : tunnel.problem)
    return tunnel.checkedAgoS.map { "\(text)  (\($0) s ago)" } ?? text
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 10) {
      HStack(spacing: 10) {
        HStack(spacing: 7) {
          LiveDot(color: state == .on ? Color(red: 0.18, green: 0.60, blue: 0.41) : .ink, beating: state == .on && !reduceMotion)
          Text(word).font(.system(size: 13, weight: .black, design: .rounded)).tracking(0.8)
        }
        .padding(.leading, 9).padding(.trailing, 12).padding(.vertical, 4)
        .background(Capsule().fill(tint.opacity(state == .off ? 1 : 0.55)))
        .overlay(Capsule().stroke(Color.ink, lineWidth: 2))
        .animation(.easeInOut(duration: 0.4), value: word)
        if let url = tunnel.url, let link = URL(string: url) {
          Link(url.replacingOccurrences(of: "https://", with: ""), destination: link)
            .font(.system(size: 13, weight: .heavy, design: .rounded)).foregroundStyle(Color.ink)
            .lineLimit(1).truncationMode(.middle)
        }
        Spacer(minLength: 0)
      }
      Grid(alignment: .leading, horizontalSpacing: 14, verticalSpacing: 5) {
        fact("ngrok", tunnel.running ? "running" : "not running")
        fact("Reaches the hub", reach)
        fact("Traffic", "\(tunnel.requests) requests, \(tunnel.openConns) open now")
      }
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(RoundedRectangle(cornerRadius: 18).fill(Color.card))
    .background(RoundedRectangle(cornerRadius: 18).fill(Color.ink).offset(x: 3, y: 3))
    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.ink, lineWidth: 2.5))
  }

  private func fact(_ label: String, _ value: String) -> some View {
    GridRow {
      Text(label).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.65))
      Text(value).font(.system(size: 13, weight: .heavy, design: .rounded)).textSelection(.enabled)
    }
  }
}

// A dot with a ring that keeps expanding from it while the tunnel is live.
struct LiveDot: View {
  let color: Color
  let beating: Bool

  var body: some View {
    TimelineView(.animation(paused: !beating)) { context in
      let p = beating ? (context.date.timeIntervalSinceReferenceDate / 1.6).truncatingRemainder(dividingBy: 1) : 1
      ZStack {
        Circle().stroke(color, lineWidth: 2).frame(width: 10, height: 10).scaleEffect(1 + 1.2 * p).opacity(1 - p)
        Circle().fill(color).frame(width: 10, height: 10)
      }
    }
    .frame(width: 12, height: 12)
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

// RAM history as lines, scaled to the Mac's total memory; the dashed line is 90%.
struct ChartCard: View {
  let chart: HealthChart
  private let colors = [Color(red: 0.18, green: 0.44, blue: 0.69), Color(red: 0.88, green: 0.54, blue: 0.07)]

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      GeometryReader { geo in
        let w = geo.size.width, h = geo.size.height
        let n = max(2, chart.series.map(\.values.count).max() ?? 2)
        let y = { (v: Double) in h - 4 - CGFloat(v / chart.max) * (h - 8) }
        ZStack(alignment: .topLeading) {
          ForEach([0.5, 0.9], id: \.self) { f in
            Path { p in p.move(to: CGPoint(x: 0, y: y(chart.max * f))); p.addLine(to: CGPoint(x: w, y: y(chart.max * f))) }
              .stroke(Color.ink.opacity(0.25), style: StrokeStyle(lineWidth: 1, dash: f == 0.9 ? [4, 3] : [1, 3]))
            Text("\(Int((chart.max * f).rounded())) \(chart.unit)").font(.system(size: 9, weight: .semibold, design: .rounded))
              .foregroundStyle(Color.ink.opacity(0.55)).offset(x: 2, y: y(chart.max * f) - 13)
          }
          ForEach(Array(chart.series.enumerated()), id: \.element.id) { i, s in
            Path { p in
              for (j, v) in s.values.enumerated() {
                let pt = CGPoint(x: w * CGFloat(j) / CGFloat(n - 1), y: y(v))
                j == 0 ? p.move(to: pt) : p.addLine(to: pt)
              }
            }
            .stroke(colors[i % colors.count], style: StrokeStyle(lineWidth: 2.2, lineJoin: .round))
          }
        }
      }
      .frame(height: 110)
      HStack(spacing: 14) {
        ForEach(Array(chart.series.enumerated()), id: \.element.id) { i, s in
          HStack(spacing: 6) {
            RoundedRectangle(cornerRadius: 2).fill(colors[i % colors.count]).frame(width: 12, height: 4)
            Text("\(s.label) \(s.values.last.map { String(format: "%.2f", $0) } ?? "0") \(chart.unit)")
              .font(.system(size: 12, weight: .semibold, design: .rounded))
          }
        }
      }
    }
    .padding(12)
    .background(RoundedRectangle(cornerRadius: 16).fill(Color.card))
    .background(RoundedRectangle(cornerRadius: 16).fill(Color.ink).offset(x: 3, y: 3))
    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.ink, lineWidth: 2.5))
    .accessibilityElement(children: .combine)
    .accessibilityLabel("RAM used over the last 10 minutes")
  }
}

struct ContentView: View {
  @EnvironmentObject var engine: Engine
  @State private var confirmStop = false
  @State private var popStart = false
  @Environment(\.accessibilityReduceMotion) private var reduceMotion

  private var startEnabled: Bool { engine.status != nil && engine.status?.busy != true }
  private var stopEnabled: Bool { startEnabled && engine.anyUp }

  private var startTitle: String {
    guard engine.status != nil else { return "…" }
    return engine.starting ? "STARTING…" : engine.ready ? "READY" : "START"
  }

  private var stopTitle: String {
    guard engine.status != nil else { return "…" }
    return engine.stopping ? "STOPPING…" : engine.anyUp ? "STOP" : "OFF"
  }

  private var startFace: some View {
    ButtonFace(icon: engine.starting ? nil : engine.ready ? "checkmark" : "power", text: startTitle)
  }

  private var stopFace: some View {
    ButtonFace(icon: engine.stopping ? nil : "stop.fill", text: stopTitle)
  }

  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        VStack(spacing: 4) {
          Text("Edge AI").font(.system(size: 30, weight: .heavy, design: .rounded))
          Text("Gemma 4 E2B on this Mac, for the app and the phones")
            .font(.system(size: 14, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.7))
        }
        HStack(spacing: 36) {
          Button { engine.send("start") } label: { startFace }
            .buttonStyle(BigButtonStyle(
              top: engine.ready ? Color(red: 0.72, green: 0.94, blue: 0.83) : Color(red: 1.0, green: 0.86, blue: 0.54),
              bottom: engine.ready ? Color(red: 0.14, green: 0.47, blue: 0.31) : Color(red: 0.72, green: 0.40, blue: 0.06),
              halo: engine.starting ? .spin : engine.ready ? .glow : startEnabled ? .ripple : .none,
              haloColor: engine.ready ? .okGreen : Color(red: 0.94, green: 0.63, blue: 0.17),
              enabled: startEnabled))
            .disabled(!startEnabled)
            .scaleEffect(popStart ? 1.08 : 1)

          Button { confirmStop = true } label: { stopFace }
            .buttonStyle(BigButtonStyle(
              top: Color(red: 1.0, green: 0.55, blue: 0.56),
              bottom: Color(red: 0.71, green: 0.15, blue: 0.17),
              halo: engine.stopping ? .spin : .none,
              haloColor: Color(red: 0.90, green: 0.28, blue: 0.30),
              enabled: stopEnabled))
            .disabled(!stopEnabled)
            .confirmationDialog("Stop Gemma, the hub and the tunnel?", isPresented: $confirmStop) {
              Button("Stop everything", role: .destructive) { engine.send("stop") }
            } message: {
              Text("Phones will lose the AI until you press START again.")
            }
        }
        .padding(.vertical, 18)
        .animation(.spring(response: 0.35, dampingFraction: 0.6), value: startTitle)
        .animation(.spring(response: 0.35, dampingFraction: 0.6), value: stopTitle)
        .onChange(of: engine.ready) { ready in
          guard ready, !reduceMotion else { return }
          withAnimation(.spring(response: 0.25, dampingFraction: 0.45)) { popStart = true }
          DispatchQueue.main.asyncAfter(deadline: .now() + 0.25) {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.5)) { popStart = false }
          }
        }

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
          .transition(.scale(scale: 0.9).combined(with: .opacity))
        }

        if let tunnel = engine.status?.tunnel {
          section("Tunnel for phones") { TunnelCard(tunnel: tunnel) }
        }

        section("Status") {
          ForEach(engine.status?.parts ?? []) { part in
            Row(color: part.ok ? .okGreen : .offRose, label: part.label, detail: part.detail)
              .animation(.easeInOut(duration: 0.4), value: part.ok)
          }
        }

        healthHeader

        ForEach(engine.status?.sections ?? []) { sec in
          section(sec.title, badge: badge(for: sec.rows)) {
            if let note = sec.note {
              Text(note).font(.system(size: 12, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.6))
            }
            if let chart = sec.chart { ChartCard(chart: chart) }
            ForEach(sec.rows) { r in
              Row(color: .health(r.state), label: r.label, detail: r.detail, pulsing: r.state == "running")
                .animation(.easeInOut(duration: 0.4), value: r.state)
            }
          }
        }

        if let steps = engine.status?.steps, !steps.isEmpty {
          section("Last run") {
            ForEach(steps) { step in
              Row(
                color: step.state == "ok" ? .okGreen : step.state == "running" ? .waitYellow : .offRose,
                label: step.label, detail: step.detail, pulsing: step.state == "running")
              .transition(.move(edge: .top).combined(with: .opacity))
            }
          }
        }

      }
      .padding(24)
      .foregroundStyle(Color.ink)
      .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.8), value: engine.status?.steps.map(\.label))
      .animation(reduceMotion ? nil : .spring(response: 0.4, dampingFraction: 0.8), value: engine.status?.test?.text)
    }
    .frame(minWidth: 440, idealWidth: 460, minHeight: 640, idealHeight: 820)
    .background(Color.cream)
    .onAppear { engine.boot() }
  }

  private var checking: Bool { engine.status?.live?.running == true }

  // Title, a one-line count of every row, and the button for the live check.
  private var healthHeader: some View {
    let rows = (engine.status?.sections ?? []).flatMap(\.rows)
    let count = { (s: String) in rows.filter { $0.state == s }.count }
    var summary = "\(count("ok")) fine, \(count("warn")) to watch, \(count("fail")) broken"
    if let at = engine.status?.live?.at {
      summary += ". Live check \(Date(timeIntervalSince1970: at / 1000).formatted(date: .omitted, time: .standard))"
    } else {
      summary += ". Live checks not run yet"
    }
    return VStack(alignment: .leading, spacing: 6) {
      HStack {
        Text("Every part of SIBOL").font(.system(size: 18, weight: .heavy, design: .rounded))
        Spacer()
        Button { engine.send("check") } label: {
          Text(checking ? "CHECKING…" : "CHECK EVERYTHING")
            .font(.system(size: 13, weight: .black, design: .rounded)).tracking(0.6)
            .padding(.horizontal, 16).padding(.vertical, 8)
            .background(Capsule().fill(checking ? Color.waitYellow : Color.checkBlue))
            .background(Capsule().fill(Color.ink).offset(y: 4))
            .overlay(Capsule().stroke(Color.ink, lineWidth: 2.5))
        }
        .buttonStyle(.plain)
        .disabled(checking || engine.status == nil)
        .help("Asks Gemma one question per mode and language, plays a short voice line per mode, and runs the unit tests")
      }
      Text(summary).font(.system(size: 13, weight: .semibold, design: .rounded)).foregroundStyle(Color.ink.opacity(0.7))
    }
    .padding(.top, 14)
  }

  private func badge(for rows: [HealthRow]) -> (String, Color)? {
    let bad = rows.filter { $0.state == "fail" }.count
    let warn = rows.filter { $0.state == "warn" }.count
    if bad > 0 { return ("\(bad) broken", .offRose) }
    if warn > 0 { return ("\(warn) to watch", .waitYellow) }
    return rows.contains { $0.state == "ok" } ? ("OK", Color(red: 0.75, green: 0.93, blue: 0.84)) : nil
  }

  @ViewBuilder
  private func section<Content: View>(_ title: String, badge: (String, Color)? = nil, @ViewBuilder content: () -> Content) -> some View {
    VStack(alignment: .leading, spacing: 8) {
      HStack {
        Text(title).font(.system(size: 15, weight: .heavy, design: .rounded))
        Spacer()
        if let (text, tint) = badge {
          Text(text).font(.system(size: 11, weight: .black, design: .rounded))
            .padding(.horizontal, 9).padding(.vertical, 2)
            .background(Capsule().fill(tint))
            .overlay(Capsule().stroke(Color.ink, lineWidth: 2))
        }
      }
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
