import gradio as gr
import tensorflow as tf
from tensorflow.keras import layers
import joblib
import numpy as np
import pickle

# Replace the joblib line with this:
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)
# 1. Define the "Blueprint" for the cloud
@tf.keras.utils.register_keras_serializable()
class AttentionLayer(layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        feature_dim=input_shape[-1]
       self.W = self.add_weight(
            name="att_weight",
            shape=(feature_dim,feature_dim),
            initializer="glorot_uniform",
            trainable=True)

        self.u = self.add_weight(
                name="att_context",
                shape=(feature_dim,1),
                initializer="glorot_uniform",
                trainable=True)

        self.b = self.add_weight(
            name="att_bias",
            shape=(feature_dim,),
            initializer="zeros",
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)

    def call(self, inputs):
        # Compute e = tanh(Wx + b)
        score = tf.nn.tanh(tf.tensordot(inputs, self.W, axes=1) + self.b)
        # Compute alignment alpha = softmax(score * u)
        attention_weights = tf.nn.softmax(tf.tensordot(score, self.u, axes=1), axis=1)
        # Output is the weighted sum of inputs
        return tf.reduce_sum(inputs * attention_weights, axis=1)

    def get_config(self):
        return super(AttentionLayer, self).get_config()
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
        # 1. Parse the comma-separated string into a flat numpy array
        raw_data = np.fromstring(input_csv, sep=',')
        
        # 2. Check if we have exactly 630 values (30 cycles * 21 sensors)
        if raw_data.size != 30 * 21:
            return f"Error: Expected 630 values (30 time steps x 21 sensors), but got {raw_data.size}"
        
        # 3. Reshape for the Scaler (630 total features for a flat transform, 
        # or transform 30 rows of 21 sensors)
        data_for_scaler = raw_data.reshape(30, 21)
        scaled_data = scaler.transform(data_for_scaler) # Scaling each time step
        
        # 4. Reshape for the Model: (Batch, TimeSteps, Features) -> (1, 30, 21)
        model_input = scaled_data.reshape(1, 30, 21)
        
        # 5. Predict
        prediction = model.predict(model_input)
        return f"Engine RUL Prediction: {round(float(prediction[0][0]), 2)} Cycles"
        
    except Exception as e:
        return f"Error: {str(e)}"

demo = gr.Interface(fn=predict, inputs="text", outputs="text", title="Aviation RUL Engine")
demo.launch()