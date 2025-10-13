import { execSync } from "child_process"
import * as fs from "fs"

interface LighthouseScore {
  performance: number
  accessibility: number
  bestPractices: number
  seo: number
  pwa: number
}

const MINIMUM_SCORES = {
  performance: 90,
  accessibility: 90,
  bestPractices: 90,
  seo: 90,
  pwa: 80,
}

async function runLighthouseAudit(url: string): Promise<LighthouseScore> {
  console.log(`🔍 Running Lighthouse audit on ${url}...`)

  try {
    const output = execSync(
      `lighthouse ${url} --output=json --output-path=./lighthouse-report.json --chrome-flags="--headless" --quiet`,
      { encoding: "utf-8" },
    )

    const report = JSON.parse(fs.readFileSync("./lighthouse-report.json", "utf-8"))

    const scores: LighthouseScore = {
      performance: Math.round(report.categories.performance.score * 100),
      accessibility: Math.round(report.categories.accessibility.score * 100),
      bestPractices: Math.round(report.categories["best-practices"].score * 100),
      seo: Math.round(report.categories.seo.score * 100),
      pwa: Math.round(report.categories.pwa.score * 100),
    }

    return scores
  } catch (error) {
    console.error("❌ Lighthouse audit failed:", error)
    throw error
  }
}

function printResults(scores: LighthouseScore): boolean {
  console.log("\n📊 Lighthouse Audit Results:")
  console.log("============================")

  let allPassed = true

  Object.entries(scores).forEach(([category, score]) => {
    const minimum = MINIMUM_SCORES[category as keyof LighthouseScore]
    const passed = score >= minimum
    const icon = passed ? "✅" : "❌"
    const status = passed ? "PASS" : "FAIL"

    console.log(`${icon} ${category.padEnd(20)} ${score}/100 (min: ${minimum}) - ${status}`)

    if (!passed) allPassed = false
  })

  console.log("============================\n")

  return allPassed
}

async function main() {
  const url = process.env.SITE_BASE_URL || "http://localhost:3000"

  try {
    const scores = await runLighthouseAudit(url)
    const passed = printResults(scores)

    if (passed) {
      console.log("✅ All Lighthouse checks passed!")
      process.exit(0)
    } else {
      console.log("❌ Some Lighthouse checks failed. Please improve scores before deployment.")
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Lighthouse audit failed:", error)
    process.exit(1)
  }
}

main()
