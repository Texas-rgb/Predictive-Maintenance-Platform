import gradio as gr
import tensorflow as tf
from tensorflow.keras import layers
import joblib
import numpy as np

# 1. Define the "Blueprint" for the cloud
@tf.keras.utils.register_keras_serializable()
class AttentionLayer(layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
       self.W = self.add_weight(
            name="attention_weight",
            shape=(input_shape[-1],
            input_shape[-1]),
            initializer="glorot_uniform",
            trainable=True)

        self.u = self.add_weight(
                name="attention_context",
                shape=(input_shape[-1],),
                initializer="zeros",
                trainable=True)
        self.b = self.add_weight(
            name="attention_bias",
            shape=(input_shape[-1],),
            initializer="zeros",
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)

    def call(self, x):
        e = tf.keras.backend.tanh(tf.keras.backend.dot(x, self.W) + self.b)
        a = tf.keras.backend.softmax(e, axis=1)
        output = x * a
        return tf.keras.backend.sum(output, axis=1)

# 2. Load the model using the "custom_objects" map
# This tells TensorFlow: "When you see 'AttentionLayer', use the class I just defined."
model = tf.keras.models.load_model(
    "attention_lstm_model.keras", 
    custom_objects={'AttentionLayer': AttentionLayer}
)
scaler = joblib.load("scaler.pkl")

# 3. The Inference Logic
def predict(input_csv):
    try:
        raw_data = np.fromstring(input_csv, sep=',')
        # Adjusting to the shape your model expects (e.g., 50 time steps, 24 features)
        data_reshaped = raw_data.reshape(1, -1) 
        scaled = scaler.transform(data_reshaped)
        # Ensure this matches your model's training input shape!
        prediction = model.predict(scaled.reshape(1, 30, 64)) 
        return f"Engine RUL Prediction: {round(float(prediction[0][0]), 2)} Cycles"
    except Exception as e:
        return f"Error: {str(e)}"

demo = gr.Interface(fn=predict, inputs="text", outputs="text", title="Aviation RUL Engine")
demo.launch()