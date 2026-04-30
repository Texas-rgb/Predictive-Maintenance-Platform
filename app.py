import gradio as gr
import tensorflow as tf
from tensorflow.keras import layers
import numpy as np

# 1. Define the custom Attention Layer
@tf.keras.utils.register_keras_serializable()
class AttentionLayer(layers.Layer):
    def __init__(self, **kwargs):
        super(AttentionLayer, self).__init__(**kwargs)

    def build(self, input_shape):
        feature_dim = input_shape[-1]
        # FIX: Ensure these are all indented with exactly 8 spaces (2 tabs)
        self.W = self.add_weight(
            name="att_weight",
            shape=(feature_dim, feature_dim),
            initializer="glorot_uniform",
            trainable=True
        )
        self.u = self.add_weight(
            name="att_context",
            shape=(feature_dim, 1),
            initializer="glorot_uniform",
            trainable=True
        )
        self.b = self.add_weight(
            name="att_bias",
            shape=(feature_dim,),
            initializer="zeros",
            trainable=True
        )
        super(AttentionLayer, self).build(input_shape)

    def call(self, inputs):
        score = tf.nn.tanh(tf.tensordot(inputs, self.W, axes=1) + self.b)
        attention_weights = tf.nn.softmax(tf.tensordot(score, self.u, axes=1), axis=1)
        return tf.reduce_sum(inputs * attention_weights, axis=1)

    def get_config(self):
        return super(AttentionLayer, self).get_config()

# 2. Load the model 
# Custom objects must include AttentionLayer
model = tf.keras.models.load_model(
    "attention_lstm_model.keras", 
    custom_objects={'AttentionLayer': AttentionLayer}
)

# 3. The Inference Logic (Scaler-Free version)
def predict(input_csv):
    try:
        # Convert comma string to numpy
        raw_data = np.fromstring(input_csv, sep=',')
        
        # Check size: 30 cycles * 21 sensors = 630
        if raw_data.size != 630:
            return f"Error: Expected 630 values, but got {raw_data.size}"
        
        # Reshape for the model: (Batch, TimeSteps, Features)
        # Note: Scaling now happens INSIDE the model via the Normalization layer
        model_input = raw_data.reshape(1, 30, 21)
        
        prediction = model.predict(model_input)
        rul_value = max(0, float(prediction[0][0])) # Ensure RUL isn't negative
        
        return f"Engine RUL Prediction: {round(rul_value, 2)} Cycles"
        
    except Exception as e:
        return f"Prediction Error: {str(e)}"

# 4. Launch Interface
demo = gr.Interface(
    fn=predict, 
    inputs=gr.Textbox(placeholder="Paste 630 comma-separated sensor values here..."), 
    outputs="text", 
    title="Aviation Engine RUL Predictor"
)

if __name__ == "__main__":
    demo.launch()