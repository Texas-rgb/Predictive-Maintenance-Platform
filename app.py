import gradio as gr
import tensorflow as tf
import joblib
import numpy as np

# This runs on Hugging Face's high-end CPUs, not your laptop!
model = tf.keras.models.load_model("attention_lstm_model.keras")
scaler = joblib.load("scaler.pkl")

def predict(input_csv):
    # Process the sensor data
    raw_data = np.fromstring(input_csv, sep=',')
    scaled = scaler.transform(raw_data.reshape(-1, 24))
    prediction = model.predict(scaled.reshape(1, 50, 24))
    return f"Engine RUL Prediction: {round(float(prediction[0][0]), 2)} Cycles"

demo = gr.Interface(fn=predict, inputs="text", outputs="text")
demo.launch()