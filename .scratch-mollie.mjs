import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
const env = Object.fromEntries(readFileSync("./.env.local","utf8").split("\n").filter(l=>l.includes("=")).map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim()]}));
const a = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const one = async (e) => (await a.from("profiles").select("*").eq("email", `gomaar.schurmans+${e}@gmail.com`).single()).data;
const mode = process.argv[2];
if (mode === "setup") {
  const c = await one("v3debug"); const s = await one("studenttest");
  const { error } = await a.from("tasks").insert({ title: "Tuinonderhoud", category: "Tuinonderhoud", description: "TESTMOLLIE betaaltest", date: "2026-11-02", time: "09:00", end_time: "10:00", location: "Molliestraat 1, 3840 Borgloon", city: "Borgloon", hours: 1, rate_at_creation: 22.5, client_id: c.id, client_name: c.name, client_email: c.email, student_id: s.id, student_name: s.name, student_email: s.email, status: "accepted", accepted_at: new Date().toISOString() });
  console.log(error?.message ?? "testklus aangemaakt (1 uur, € 22,50)");
} else if (mode === "status") {
  const { data: t } = await a.from("tasks").select("id,status,payment_status,mollie_payment_id,paid_at").like("description","TESTMOLLIE%");
  const { data: inv } = await a.from("invoices").select("invoice_number,total").in("task_id", (t??[]).map(x=>x.id));
  console.log(JSON.stringify(t), JSON.stringify(inv));
} else if (mode === "cleanup") {
  const { data: t } = await a.from("tasks").select("id").like("description","TESTMOLLIE%");
  for (const x of t ?? []) { await a.from("invoices").delete().eq("task_id", x.id); await a.from("tasks").delete().eq("id", x.id); }
  const { data: inv } = await a.from("invoices").select("invoice_number");
  console.log("opgeruimd:", t?.length, "| resterende facturen:", JSON.stringify(inv?.map(i=>i.invoice_number)));
}
