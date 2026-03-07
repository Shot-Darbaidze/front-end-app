export function reportWebVitals(metric: any) {
  if (metric.label === "web-vital") {
    // You can send this to Google Analytics or another provider
    // window.gtag('event', metric.name, { value: metric.value, ...metric });
    console.log("Web Vitals:", metric);
  }
}
