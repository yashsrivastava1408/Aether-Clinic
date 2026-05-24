import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin


class ArrayToDataFrameTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, columns):
        self.columns = columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            frame = X.copy()
            missing = [col for col in self.columns if col not in frame.columns]
            if missing:
                raise ValueError(f"Missing expected columns: {missing}")
            return frame[self.columns]

        arr = np.asarray(X)
        if arr.ndim == 1:
            arr = arr.reshape(1, -1)
        if arr.shape[1] != len(self.columns):
            raise ValueError(
                f"Expected {len(self.columns)} features, received {arr.shape[1]}"
            )
        return pd.DataFrame(arr, columns=self.columns)


class HeartFrontendEncodingTransformer(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.cp_map = {1.0: 0.0, 2.0: 1.0, 3.0: 2.0, 4.0: 3.0}
        self.slope_map = {1.0: 0.0, 2.0: 1.0, 3.0: 2.0}
        self.thal_map = {3.0: 1.0, 6.0: 2.0, 7.0: 3.0}

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        frame = X.copy()
        frame["cp"] = frame["cp"].replace(self.cp_map)
        frame["slope"] = frame["slope"].replace(self.slope_map)
        frame["thal"] = frame["thal"].replace(self.thal_map)
        frame["ca"] = frame["ca"].astype(float)
        return frame


class ZeroAsMissingTransformer(BaseEstimator, TransformerMixin):
    def __init__(self, columns):
        self.columns = columns

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        frame = X.copy()
        for col in self.columns:
            frame[col] = frame[col].replace(0, np.nan)
        return frame
