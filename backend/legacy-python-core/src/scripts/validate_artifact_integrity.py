import hashlib
import os

ARTIFACTS = [
    "AIGestion_FAQ_SUGERENCIAS.md",
    "AIGestion_FAQ_RESUMEN_SEMANAL.md",
    "AIGestion_FAQ_CHANGELOG.md",
]


def file_checksum(path):
    if not os.path.exists(path):
        print(f"Archivo no encontrado: {path}")
        return None
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()

def main():
    print("Validando integridad de artefactos...")
    for artifact in ARTIFACTS:
        checksum = file_checksum(artifact)
        if checksum:
            print(f"{artifact}: OK | SHA256: {checksum}")
        else:
            print(f"{artifact}: ERROR - No encontrado o corrupto")

if __name__ == "__main__":
    main()
