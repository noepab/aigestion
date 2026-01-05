
import torch.nn as nn


class HOPEBlock(nn.Module):
    """
    Fundamental building block of the HOPE architecture.
    Consists of a residual connection with non-linear transformation.
    """
    def __init__(self, in_features, expansion=4):
        super().__init__()
        self.fc1 = nn.Linear(in_features, in_features * expansion)
        self.bn1 = nn.BatchNorm1d(in_features * expansion)
        self.fc2 = nn.Linear(in_features * expansion, in_features)
        self.bn2 = nn.BatchNorm1d(in_features)
        self.activation = nn.GELU()

    def forward(self, x):
        identity = x
        out = self.fc1(x)
        out = self.bn1(out)
        out = self.activation(out)
        out = self.fc2(out)
        out = self.bn2(out)
        out += identity
        out = self.activation(out)
        return out

class HOPEEncoder(nn.Module):
    """
    Encoder composed of stacked HOPEBlocks.
    """
    def __init__(self, input_dim, hidden_dim, num_blocks=3):
        super().__init__()
        self.embedding = nn.Linear(input_dim, hidden_dim)
        self.blocks = nn.ModuleList([
            HOPEBlock(hidden_dim) for _ in range(num_blocks)
        ])

    def forward(self, x):
        out = self.embedding(x)
        for block in self.blocks:
            out = block(out)
        return out

class HOPEClassifier(nn.Module):
    """
    Classification head.
    """
    def __init__(self, hidden_dim, num_classes):
        super().__init__()
        self.fc = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        return self.fc(x)

class HOPEExtractor(nn.Module):
    """
    Full architecture combining Encoder and Classifier (optional).
    """
    def __init__(self, input_dim, hidden_dim, num_classes=None):
        super().__init__()
        self.encoder = HOPEEncoder(input_dim, hidden_dim)
        self.classifier = HOPEClassifier(hidden_dim, num_classes) if num_classes else None

    def forward(self, x):
        features = self.encoder(x)
        if self.classifier:
            return self.classifier(features)
        return features

def create_hope_lite(input_dim=10, hidden_dim=64, num_classes=2):
    return HOPEExtractor(input_dim, hidden_dim, num_classes)
