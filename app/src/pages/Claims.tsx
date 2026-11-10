import { useState } from "react";
import { CATEGORIES } from "../data/categories";
import type { Reimbursement } from "../data/types";
import { approvalState, canApprove, TWO_APPROVER_LIMIT_CENTS } from "../lib/reimburse";
import { formatMoney, parseMoney } from "../lib/money";
import { Empty, Loading, Modal, Money, Page, Pill, dateLabel, todayIso, useAction, useCan, useStore, useTable } from "../ui";
import { ReceiptLink } from "./Ledger";

const TONE: Record<Reimbursement["status"], string> = { submitted: "soon", approved: "later", paid: "done", rejected: "overdue" };

export function Claims() {
  const store = useStore();
  const run = useAction();
  const finance = useCan("money.approve");
  const exec = useCan("money.view");
  const { rows, reload } = useTable("reimbursements");
  const approvals = useTable("reimbursement_approvals");
  const [filing, setFiling] = useState(false);
  const refresh = async () => { await Promise.all([reload(), approvals.reload()]); };
  const approversOf = (id: string) => (approvals.rows || []).filter(a => a.reimbursement_id === id).map(a => a.approver);

  return (
    <Page title="Reimbursements" intro={<>Spent your own money on club business? File it here with a photo of the receipt. Claims over {formatMoney(TWO_APPROVER_LIMIT_CENTS)} need two approvers, and nobody approves their own.</>}
      actions={<button className="primary" onClick={() => setFiling(true)}>File a claim</button>}>
      {!rows ? <Loading /> : rows.length === 0 ? <Empty>No claims {exec ? "yet" : "from you yet"}.</Empty> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Spent</th>{exec && <th>Who</th>}<th>What</th><th className="num">Amount</th><th>Status</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {rows.map(c => {
                const approvers = approversOf(c.id);
                const state = approvalState(c.amount_cents, approvers);
                return (
                  <tr key={c.id}>
                    <td data-label="Spent">{dateLabel(c.spent_on)}</td>
                    {exec && <td data-label="Who">{c.submitter_name}</td>}
                    <td data-label="What">{c.description}{c.category && <small className="muted block">{c.category}</small>}{c.decision_note && <small className="block">Note: {c.decision_note}</small>}</td>
                    <td data-label="Amount" className="num"><Money cents={c.amount_cents} /></td>
                    <td data-label="Status"><Pill tone={TONE[c.status]}>{c.status}</Pill>{c.status === "submitted" && <small className="muted block">{state.have} of {state.needed} approvals</small>}</td>
                    <td className="row-actions">
                      {c.receipt_path && <ReceiptLink path={c.receipt_path} />}
                      {finance && canApprove(c, store.session.userId, approvers) && <button onClick={() => run(() => store.approveClaim(c.id), "Approved").then(refresh)}>Approve</button>}
                      {finance && c.status === "approved" && <button className="primary" onClick={() => run(() => store.payClaim(c.id, todayIso()), "Paid and added to the ledger").then(refresh)}>Mark paid</button>}
                      {finance && (c.status === "submitted" || c.status === "approved") && <button className="ghost" onClick={() => {
                        const note = prompt("Why is this claim rejected? The member sees this note.");
                        if (note) void run(() => store.rejectClaim(c.id, note), "Rejected").then(refresh);
                      }}>Reject</button>}
                      {c.submitted_by === store.session.userId && c.status === "submitted" && <button className="ghost" onClick={() => {
                        if (confirm("Withdraw this claim?")) void run(() => store.remove("reimbursements", c.id), "Withdrawn").then(refresh);
                      }}>Withdraw</button>}
                    </td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>)}
      {filing && <ClaimForm onClose={() => setFiling(false)} onDone={refresh} />}
    </Page>
  );
}

function ClaimForm({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const store = useStore();
  const run = useAction();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Gear");
  const [spentOn, setSpentOn] = useState(todayIso());
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="File a claim" onClose={onClose}>
      <form className="form" onSubmit={async e => {
        e.preventDefault();
        const cents = parseMoney(amount);
        if (!description.trim()) return setError("Say what you bought.");
        if (!cents || cents <= 0) return setError("Enter the amount, like 42.80.");
        setBusy(true);
        const ok = await run(async () => {
          const receipt_path = file ? await store.uploadReceipt(file) : null;
          await store.insert("reimbursements", {
            submitted_by: store.session.userId, submitter_name: store.session.name, description: description.trim(),
            amount_cents: cents, category, spent_on: spentOn, receipt_path, status: "submitted"
          });
        }, "Claim filed. The treasurer has been told.");
        setBusy(false);
        if (ok) { onClose(); await onDone(); }
      }}>
        <div className="grid">
          <label className="wide"><span>What did you buy? *</span><input value={description} onChange={e => setDescription(e.target.value)} required /></label>
          <label><span>Amount *</span><input inputMode="decimal" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required /></label>
          <label><span>Date spent</span><input type="date" value={spentOn} onChange={e => setSpentOn(e.target.value)} /></label>
          <label><span>Category</span><select value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
          <label className="wide"><span>Receipt photo or PDF</span><input type="file" accept="image/*,application/pdf" capture="environment" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="form-actions"><button className="primary" disabled={busy}>{busy ? "Filing…" : "File claim"}</button></div>
      </form>
    </Modal>
  );
}
