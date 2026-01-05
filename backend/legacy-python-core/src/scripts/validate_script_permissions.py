import os
import stat

SCRIPTS = [
    "analyze_help_queries.py",
    "notify_faq_suggestions.py",
    "validate_faq_format.py",
    "validate_slack_credentials.py",
    "generate_weekly_faq_summary.py",
    "generate_faq_changelog.py",
    "validate_artifact_integrity.py",
    "notify_critical_suggestions_slack.py",
    "generate_faq_dashboard.py"
]

def check_permissions(path):
    if not os.path.exists(path):
        return False, "No existe"
    st = os.stat(path)
    is_readable = bool(st.st_mode & stat.S_IRUSR)
    is_executable = bool(st.st_mode & stat.S_IXUSR)
    return is_readable, is_executable

def main():
    print("Validando permisos de ejecución de scripts...")
    for script in SCRIPTS:
        readable, executable = check_permissions(script)
        status = []
        if readable:
            status.append("lectura OK")
        else:
            status.append("sin permiso de lectura")
        if executable:
            status.append("ejecución OK")
        else:
            status.append("sin permiso de ejecución")
        print(f"{script}: {', '.join(status)}")

if __name__ == "__main__":
    main()
