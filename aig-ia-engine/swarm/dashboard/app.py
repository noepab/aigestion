import json
import os
import sys
import time
from datetime import datetime

import pandas as pd
import streamlit as st

st.set_page_config(page_title="AIGestion God Mode", page_icon="🌌", layout="wide")

STATE_FILE = "C:\\Users\\Alejandro\\AIG\\AIG-ia-engine\\swarm\\swarm_state.json"
SCHEDULER_LOG_FILE = "C:\\Users\\Alejandro\\AIG\\AIG-ia-engine\\scheduler.log"

# Header
st.title("🌌 AIGestion God Mode: Swarm Intelligence")
st.markdown("---")

# Metrics
col1, col2, col3, col4 = st.columns(4)

status = "Unknown"
last_update = "Never"
active_agents = 0

if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            history = data.get("history", [])
            last_update = data.get("last_update", "N/A")

            # Simple heuristic
            if history:
                last_event_time = datetime.fromisoformat(history[-1]["timestamp"])
                time_diff = (datetime.now() - last_event_time).total_seconds()
                if time_diff < 120:
                    status = "🟢 Active"
                else:
                    status = "💤 Idle"

            active_agents = len(set([e["sender"] for e in history]))
    except Exception as e:
        status = f"Error: {e}"
else:
    status = "🔴 Offline (No State File)"

col1.metric("Swarm Status", status)
col2.metric(
    "Last Update", last_update.split("T")[-1][:8] if "T" in last_update else last_update
)
col3.metric("Active Agents", active_agents)
col4.metric("Model", "Gemini-1.5-Flash")

# Real-time Feed
st.subheader("🧠 Neural Feed")

if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            history = data.get("history", [])

        if history:
            df = pd.DataFrame(history)
            df = df[["timestamp", "sender", "receiver", "type", "content"]]
            df["timestamp"] = df["timestamp"].apply(lambda x: x.split("T")[-1][:8])
            st.dataframe(df, use_container_width=True, hide_index=True)
        else:
            st.info("No activity recorded yet.")

    except Exception as e:
        st.error(f"Failed to read state: {e}")
else:
    st.warning("Waiting for Swarm initialization...")

# Manual Controls
st.subheader("🎮 Controls")
if st.button("🚀 Force Run Optimization Cycle"):
    st.toast("Triggering Swarm... (Check Console)")
    os.system("start cmd /k python ../main.py")

st.markdown("---")
st.subheader("📝 Pending Approvals")

if os.path.exists(STATE_FILE):
    try:
        with open(STATE_FILE, "r") as f:
            data = json.load(f)
            history = data.get("history", [])
            last_msg = history[-1]["content"] if history else ""

            # Look for pending logical state or just parse last message
            if "branch" in last_msg and "ready" in last_msg:
                import re

                match = re.search(r"`(.*?)`", last_msg)
                branch_name = match.group(1) if match else "unknown-branch"

                st.warning(f"Branch **{branch_name}** is waiting for review.")

                c1, c2 = st.columns(2)
                if c1.button("✅ Approve & Merge"):
                    try:
                        # Initialize GitService
                        sys.path.append(
                            os.path.abspath(
                                os.path.join(os.path.dirname(__file__), "..")
                            )
                        )
                        from services.git import GitService

                        git = GitService()

                        st.info(f"Merging {branch_name}...")
                        git.run_git(["checkout", "main"])  # Assume main is default
                        git.run_git(["merge", branch_name])
                        # git.run_git(["push", "origin", "main"]) # Optional

                        st.success(f"Merged {branch_name} successfully!")
                        st.balloons()

                        # Append merge event
                        event = {
                            "timestamp": datetime.now().isoformat(),
                            "sender": "Admin",
                            "receiver": "Swarm",
                            "type": "MERGE_COMPLETE",
                            "content": f"Merged branch {branch_name}",
                        }
                        history.append(event)
                        with open(STATE_FILE, "w") as f_write:
                            json.dump(
                                {
                                    "history": history[-50:],
                                    "last_update": datetime.now().isoformat(),
                                },
                                f_write,
                            )

                        time.sleep(1)
                        st.rerun()

                    except Exception as e:
                        st.error(f"Merge failed: {e}")

                if c2.button("❌ Reject & Delete"):
                    st.error(f"Discarding {branch_name}...")
                    # Logic to delete branch could go here
            else:
                st.info("No pending changes.")
    except Exception as e:
        st.info(f"No pending changes. ({e})")
else:
    st.info("No pending changes.")

# Auto-refresh
time.sleep(5)
st.rerun()
