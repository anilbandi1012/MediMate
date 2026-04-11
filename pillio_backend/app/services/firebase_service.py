# app/services/firebase_service.py

import firebase_admin
from firebase_admin import credentials, messaging
import os

firebase_app = None


def initialize_firebase():
    global firebase_app

    if firebase_app:
        return firebase_app

    key_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "serviceAccountKey.json"
    )

    cred = credentials.Certificate(key_path)
    firebase_app = firebase_admin.initialize_app(cred)
    return firebase_app


def send_push_notification(token: str, title: str, body: str):
    initialize_firebase()

    message = messaging.Message(
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data={
            "title": title,
            "body": body,
            "sound": "default",
            "screen": "/reminders",
            "type": "medicine_reminder",
        },
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                sound="default",
                channel_id="medicine_reminders",
                click_action="OPEN_REMINDERS",
                priority="high",
                default_sound=True,
                default_vibrate_timings=True,
            ),
        ),
        webpush=messaging.WebpushConfig(
            headers={
                "Urgency": "high"
            },
            notification={
                "title": title,
                "body": body,
                "requireInteraction": True,
                "vibrate": [500, 300, 500, 300, 1000],
                "icon": "/icon-192.png",
                "badge": "/icon-192.png",
                "tag": "medicine-reminder",
                "renotify": True,
                "actions": [
                    {
                        "action": "open",
                        "title": "Open App"
                    }
                ]
            },
            fcm_options=messaging.WebpushFCMOptions(
                link="https://medi-mate-lime.vercel.app/reminders"
            )
        ),
        token=token,
    )

    response = messaging.send(message)
    return response