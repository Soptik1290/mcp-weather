import numpy as np
import random
from typing import List, Optional, Tuple, Union

class EWMA:
    """
    Exponentially Weighted Moving Average filter.
    Used for smoothing time-series data (like hourly forecast curves).
    """
    def __init__(self, alpha: float = 0.3):
        """
        Args:
            alpha: Smoothing factor (0 < alpha <= 1).
                   Higher alpha = more weight to recent data (less smoothing).
                   Lower alpha = more smoothing (more lag).
        """
        self.alpha = alpha
        self.last_val = None

    def update(self, measurement: float) -> float:
        """Update the filter with a new measurement."""
        if measurement is None:
            return self.last_val
            
        if self.last_val is None:
            self.last_val = measurement
        else:
            self.last_val = self.alpha * measurement + (1 - self.alpha) * self.last_val
        return self.last_val

    def smooth_array(self, data: List[float]) -> List[float]:
        """Apply EWMA smoothing to an entire array."""
        if not data:
            return []
            
        smoothed = []
        # Initialize with the first valid value
        current_val = next((x for x in data if x is not None), 0.0)
        
        for x in data:
            if x is not None:
                current_val = self.alpha * x + (1 - self.alpha) * current_val
            smoothed.append(current_val)
            
        return smoothed


class KalmanFilter1D:
    """
    1D Kalman Filter for sensor fusion.
    Estimates a scalar value (e.g., Temperature) from multiple noisy measurements.
    """
    def __init__(self, process_variance: float = 1e-4, measurement_variance: float = 1.0):
        """
        Args:
            process_variance: How much the system state changes over time (uncertainty in model).
            measurement_variance: Expected noise in the measurements.
        """
        self.x = 0.0  # State estimate
        self.p = 1.0  # Estimate uncertainty (variance)
        self.q = process_variance  # Process noise variance
        self.r = measurement_variance  # Measurement noise variance
        self.initialized = False

    def predict(self):
        """Predict next state (Time Update)."""
        # In a static 1D model, predicted state is same as previous
        self.p = self.p + self.q

    def update(self, measurement: float, r: Optional[float] = None):
        """Correction step (Measurement Update)."""
        if measurement is None:
            return

        if not self.initialized:
            self.x = measurement
            self.p = r if r is not None else self.r
            self.initialized = True
            return

        measurement_noise = r if r is not None else self.r
        
        # Kalman Gain
        k = self.p / (self.p + measurement_noise)
        
        # Update estimate
        self.x = self.x + k * (measurement - self.x)
        
        # Update uncertainty
        self.p = (1 - k) * self.p

    def fuse(self, measurements: List[float], variances: Optional[List[float]] = None) -> float:
        """
        Fuse a batch of measurements at a single time step.
        Treats them as sequential updates to converge on a consensus.
        """
        if not measurements:
            return 0.0
            
        # Reset if not initialized (or treat as new batch)
        if not self.initialized:
            # Smart initialization: start with median to ignore outliers
            valid_measurements = [m for m in measurements if m is not None]
            if not valid_measurements:
                return 0.0
            self.x = float(np.median(valid_measurements))
            self.initialized = True
            
        # Update with each measurement
        for i, z in enumerate(measurements):
            if z is not None:
                r = variances[i] if variances else self.r
                self.update(z, r)
                
        return self.x


class ParticleFilter1D:
    """
    1D Particle Filter.
    Uses a cloud of particles to estimate the probability distribution of a value.
    More robust to non-Gaussian noise and multi-modal distributions (conflicting data).
    """
    def __init__(self, num_particles: int = 1000, process_noise: float = 0.5):
        self.n = num_particles
        self.process_noise = process_noise
        self.particles = []
        self.weights = []
        self.initialized = False

    def initialize(self, initial_guess: float, spread: float = 5.0):
        """Initialize particles around a guess (Gaussian)."""
        self.particles = np.random.normal(initial_guess, spread, self.n)
        self.weights = np.ones(self.n) / self.n
        self.initialized = True

    def predict(self):
        """Move particles (drift + noise)."""
        if not self.initialized: return
        self.particles += np.random.normal(0, self.process_noise, self.n)

    def update(self, measurement: float, measurement_noise: float = 1.0):
        """Update weights based on measurement likelihood."""
        if not self.initialized or measurement is None: return

        # Gaussian likelihood
        # weight ~ exp(- (particle - measurement)^2 / (2 * variance))
        denom = 2 * (measurement_noise ** 2)
        diff = self.particles - measurement
        
        # Avoid overflow/underflow logic for simplicity here
        # Using unnormalized gaussian pdf
        new_weights = np.exp(-(diff**2) / denom)
        
        # Multiply with existing weights (Bayesian update)
        self.weights *= new_weights
        
        # Normalize
        w_sum = np.sum(self.weights)
        if w_sum > 0:
            self.weights /= w_sum
        else:
            # Reset weights if all died (should rarely happen with soft likelihood)
            self.weights = np.ones(self.n) / self.n

    def resample(self):
        """Resample particles based on weights to focus on likely areas."""
        if not self.initialized: return
        
        # Systematic resampling
        indexes = np.random.choice(self.n, self.n, p=self.weights)
        self.particles = self.particles[indexes]
        self.weights = np.ones(self.n) / self.n

    def estimate(self) -> float:
        """Return the weighted mean of predictions."""
        if not self.initialized: return 0.0
        return np.sum(self.particles * self.weights)

    def fuse(self, measurements: List[float], measurement_noise: float = 1.0) -> float:
        """One-shot fusion of multiple measurements."""
        valid_measurements = [m for m in measurements if m is not None]
        if not valid_measurements: return 0.0
        
        if not self.initialized:
            self.initialize(float(np.median(valid_measurements)), spread=5.0)
            
        self.predict()
        
        for m in valid_measurements:
            self.update(m, measurement_noise)
            
        self.resample()
        return self.estimate()
