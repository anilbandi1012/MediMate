from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

# Generate private key
private_key = ec.generate_private_key(ec.SECP256R1())

# Export private key
private_bytes = private_key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
)

# Export public key
public_key = private_key.public_key()
public_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint,
)

# Convert public key to URL-safe base64
public_key_base64 = base64.urlsafe_b64encode(public_bytes).rstrip(b"=").decode("utf-8")

print("VAPID_PRIVATE_KEY:\n", private_bytes.decode())
print("VAPID_PUBLIC_KEY:\n", public_key_base64)
