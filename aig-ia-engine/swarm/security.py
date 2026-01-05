import re
from typing import Any, Union
from pydantic import BaseModel

class SecurityLayer:
    """
    Security layer to protect agent communication and data persistence.
    Focuses on PII masking and basic adversarial pattern detection.
    """

    # Regex patterns for PII
    PII_PATTERNS = {
        "EMAIL": r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+',
        "API_KEY": r'(?i)(?:key|api|token|secret|password|auth)[-_\s]*[:=][-_\s]*([a-zA-Z0-9]{16,})',
        "IPV4": r'\b(?:\d{1,3}\.){3}\d{1,3}\b',
        "CREDIT_CARD": r'\b(?:\d[ -]*?){13,16}\b'
    }

    ADVERSARIAL_KEYWORDS = [
        "ignore previous instructions",
        "system prompt",
        "dan mode",
        "jailbreak",
        "forget your rules"
    ]

    @classmethod
    def mask_pii(cls, text: str) -> str:
        """Masks sensitive information in a string."""
        if not isinstance(text, str):
            return text

        masked_text = text
        for label, pattern in cls.PII_PATTERNS.items():
            # For API keys, we want to keep the label but mask the value
            if label == "API_KEY":
                def mask_key(match):
                    full_match = match.group(0)
                    key_value = match.group(1)
                    return full_match.replace(key_value, "[MASKED_KEY]")
                masked_text = re.sub(pattern, mask_key, masked_text)
            else:
                masked_text = re.sub(pattern, f"[MASKED_{label}]", masked_text)

        return masked_text

    @classmethod
    def is_adversarial(cls, text: str) -> bool:
        """Detects basic adversarial prompt patterns."""
        if not isinstance(text, str):
            return False

        lower_text = text.lower()
        return any(keyword in lower_text for keyword in cls.ADVERSARIAL_KEYWORDS)

    @classmethod
    def sanitize_content(cls, content: Any) -> Any:
        """Recursively sanitizes content (Strings, Dicts, Lists, Pydantic Models)."""
        if isinstance(content, str):
            return cls.mask_pii(content)
        elif isinstance(content, dict):
            return {k: cls.sanitize_content(v) for k, v in content.items()}
        elif isinstance(content, list):
            return [cls.sanitize_content(i) for i in content]
        elif isinstance(content, BaseModel):
            # Convert to dict, sanitize, and return as dict (or re-instantiate if needed)
            # For logging/persistence, a sanitized dict is often safer
            data = content.model_dump()
            return cls.sanitize_content(data)
        return content
