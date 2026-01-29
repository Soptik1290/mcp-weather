
import sys
import os
import random
import numpy as np

# Add project root to path
sys.path.append(os.getcwd())

from src.filters import EWMA, KalmanFilter1D, ParticleFilter1D

def test_ewma():
    print("\n--- Testing EWMA (Smoothing) ---")
    # Simulate a noisy sine wave
    data = [10 + np.sin(i/5)*5 + random.uniform(-2, 2) for i in range(20)]
    
    ewma = EWMA(alpha=0.3)
    smoothed = ewma.smooth_array(data)
    
    print(f"{'Original':<10} | {'Smoothed':<10}")
    print("-" * 25)
    for o, s in zip(data, smoothed):
        print(f"{o:<10.2f} | {s:<10.2f}")
    
    print("Check: Smoothed values should be less volatile.")

def test_kalman():
    print("\n--- Testing Kalman Filter (Fusion) ---")
    # Simulate 3 sensors measuring true value 20.0 with noise
    true_val = 20.0
    
    kf = KalmanFilter1D(process_variance=0.1, measurement_variance=2.0)
    
    print(f"{'Sensor 1':<10} | {'Sensor 2':<10} | {'Sensor 3':<10} | {'Fused':<10} | {'Error'}")
    print("-" * 65)
    
    for _ in range(5):
        m1 = true_val + random.gauss(0, 2) # Noisy
        m2 = true_val + random.gauss(0, 3) # Noisier
        m3 = true_val + random.gauss(0, 1) # Accurate
        
        fused = kf.fuse([m1, m2, m3])
        error = abs(fused - true_val)
        
        print(f"{m1:<10.2f} | {m2:<10.2f} | {m3:<10.2f} | {fused:<10.2f} | {error:.2f}")

def test_particle():
    print("\n--- Testing Particle Filter (Non-linear/Multi-modal) ---")
    # True value is 50
    pf = ParticleFilter1D(num_particles=500)
    
    print(f"{'Measurements':<30} | {'Estimate':<10}")
    print("-" * 45)
    
    # Sequence of measurements
    measurements_list = [
        [45, 55, 52], # Spread out
        [49, 51, 50], # Tight cluster around 50
        [50, 50, 50], # Perfect agreement
        [10, 50, 50]  # One outlier (10)
    ]
    
    for measure_batch in measurements_list:
        est = pf.fuse(measure_batch)
        batch_str = ", ".join([f"{x:.1f}" for x in measure_batch])
        print(f"{batch_str:<30} | {est:.2f}")

if __name__ == "__main__":
    test_ewma()
    test_kalman()
    test_particle()
