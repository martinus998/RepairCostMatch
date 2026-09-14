from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

TARGETS = {
    "expenseleak/secure-platform-core.js": ("ctx", "#elPlatform", True),
    "expenseleak/secure-policy-center.js": ("ctx", "#elPolicyCenter", True),
    "expenseleak/secure-enterprise-ops.js": ("ctx", "#elEnterpriseOps", True),
    "expenseleak/secure-optimization.js": ("ctx", "#elOptimize", True),
    "expenseleak/secure-vault-webhooks.js": ("ctx", "#elVaultWebhooks", True),
    "expenseleak/secure-competitor-suite.js": ("ctx", "#elCompetitorSuite", True),
    "expenseleak/secure-ops.js": ("context", "#elOpsWorkspace", False),
}


def resolver(func_name: str, selector: str, role_aware: bool) -> str:
    role = "myRole=business.is_owner?'owner':(business.role||'viewer');" if role_aware else ""
    return (
        f"async function {func_name}(){{const {{data:{{user:u}}}}=await sb.auth.getUser();user=u;"
        f"if(!u){{document.querySelector('{selector}')?.remove();return false}}"
        "const selected=window.ExpenseLeakSelectedBusinessId;"
        "let q=sb.from('expenseleak_accessible_workspaces').select('id,name,role,is_owner,owner_user_id');"
        "if(selected)q=q.eq('id',selected);else q=q.order('created_at',{ascending:true}).limit(1);"
        "const {data,error}=selected?await q.maybeSingle():await q;if(error)return false;"
        "business=selected?data:(data?.[0]||null);if(!business)return false;"
        f"{role}return true}}"
    )


def harden(path: Path, func_name: str, selector: str, role_aware: bool) -> None:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    replaced = False
    prefix = f"async function {func_name}(){{"
    for i, line in enumerate(lines):
        if line.startswith(prefix):
            if "expenseleak_accessible_workspaces" not in line:
                lines[i] = resolver(func_name, selector, role_aware)
            replaced = True
            break
    if not replaced:
        raise RuntimeError(f"Could not find {func_name}() in {path}")
    text = "\n".join(lines) + ("\n" if path.read_text(encoding="utf-8").endswith("\n") else "")
    if "expenseleak:workspace-ready" not in text:
        marker = "init().catch(console.error);"
        listener = "window.addEventListener('expenseleak:workspace-ready',()=>{try{if(typeof schedule==='function')schedule(50);else if(typeof scheduleRefresh==='function')scheduleRefresh(50);else if(typeof refresh==='function')Promise.resolve(refresh()).catch(console.error)}catch(e){console.error(e)}});"
        if marker not in text:
            raise RuntimeError(f"Could not find init marker in {path}")
        text = text.replace(marker, listener + "\n" + marker, 1)
    path.write_text(text, encoding="utf-8")


for rel, cfg in TARGETS.items():
    harden(ROOT / rel, *cfg)

workflow = ROOT / ".github/workflows/expenseleak-check.yml"
text = workflow.read_text(encoding="utf-8")
start = text.index("          workspace_scoped=[")
end = text.index("          ]", start) + len("          ]")
block = """          workspace_scoped=[
            'secure-data-ops.js','secure-executive.js','secure-advanced-intelligence.js',
            'secure-savings.js','secure-renewals.js','secure-procurement.js','secure-team.js',
            'secure-platform-core.js','secure-policy-center.js','secure-enterprise-ops.js',
            'secure-optimization.js','secure-vault-webhooks.js','secure-competitor-suite.js','secure-ops.js'
          ]"""
text = text[:start] + block + text[end:]
workflow.write_text(text, encoding="utf-8")

print("ExpenseLeak workspace hardening applied to", len(TARGETS), "modules.")
