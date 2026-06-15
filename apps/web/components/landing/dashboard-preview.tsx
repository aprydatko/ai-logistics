import {
  AlertTriangle,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  Route,
  Settings,
  Truck,
} from "lucide-react";

import styles from "./dashboard-preview.module.css";

const metrics = [
  { label: "Loads", value: "1,248", change: "+12.5%" },
  { label: "Drivers", value: "842", change: "+8.1%" },
  { label: "Incidents", value: "23", change: "-15.3%" },
];

export const DashboardPreview = () => (
  <div className={styles.preview} aria-label="AI Logistics dashboard preview">
    <div className={styles.toolbar}>
      <div className={styles.previewBrand}>
        <span>
          <Route />
        </span>
        AI Logistics
      </div>
      <div className={styles.tools}>
        {[Boxes, Truck, Bot, AlertTriangle, ChartNoAxesCombined, Settings].map(
          (Icon, index) => (
            <span className={index === 0 ? styles.activeTool : ""} key={index}>
              <Icon />
            </span>
          ),
        )}
      </div>
      <span className={styles.demoButton}>View demo</span>
    </div>

    <div className={styles.dashboard}>
      <aside className={styles.sidebar}>
        <div className={styles.overview}>
          <strong>Overview</strong>
          <i />
          <i />
          <i />
          <i className={styles.shortLine} />
        </div>
        <div className={styles.sideActions}>
          <span>Live demo</span>
          <span>GitHub</span>
        </div>
        <div className={styles.miniCards}>
          <div>
            <strong>AI timeline</strong>
            <small>Live events & actions</small>
            <svg viewBox="0 0 120 36" role="img" aria-label="AI timeline chart">
              <polyline points="0,25 15,17 30,24 45,12 60,16 75,5 92,13 110,2 120,12" />
            </svg>
          </div>
          <div>
            <strong>Realtime ops</strong>
            <small>System performance</small>
            <div className={styles.bars}>
              {[12, 24, 18, 31, 16, 27, 35, 45].map((height, index) => (
                <i key={index} style={{ height }} />
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div className={styles.analytics}>
        <div className={styles.chartCard}>
          <strong>Product performance</strong>
          <div className={styles.chart}>
            <span className={styles.yAxis}>
              100
              <br />
              75
              <br />
              50
              <br />
              25
              <br />0
            </span>
            <svg viewBox="0 0 460 180" preserveAspectRatio="none">
              <line x1="0" y1="180" x2="460" y2="180" />
              <polyline points="35,135 160,103 280,70 425,31" />
              <circle cx="35" cy="135" r="8" />
              <circle cx="425" cy="31" r="8" />
            </svg>
            <div className={styles.months}>
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
            </div>
          </div>
        </div>

        <div className={styles.metrics}>
          {metrics.map((metric, index) => (
            <div className={styles.metric} key={metric.label}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <em>{metric.change}</em>
              <small>vs last 30 days</small>
              <svg viewBox="0 0 120 28" preserveAspectRatio="none">
                <polyline
                  points={
                    index === 0
                      ? "0,23 18,12 38,20 62,8 86,18 105,3 120,22"
                      : "0,10 20,21 42,23 66,7 86,19 107,5 120,20"
                  }
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
