import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Hass } from "./types";
import type { Language } from "./i18n";

export type HeaderAction = "alarm" | "notifications";

type PersistentNotification = {
  notification_id?: string;
  title?: string;
  message?: string;
  status?: string;
  created_at?: string;
};

type HeaderActionModalProps = {
  hass: Hass;
  language: Language;
  kind: HeaderAction;
  onClose: () => void;
};

export default function HeaderActionModal({ hass, language, kind, onClose }: HeaderActionModalProps) {
  const copy = language === "it" ? itCopy : enCopy;
  const alarmEntity = useMemo(
    () => Object.keys(hass.states).find((entityId) => entityId.startsWith("alarm_control_panel.")),
    [hass.states],
  );
  const alarmState = alarmEntity ? hass.states[alarmEntity]?.state : undefined;
  const [pin, setPin] = useState("");
  const [notifications, setNotifications] = useState<PersistentNotification[]>([]);
  const [loading, setLoading] = useState(kind === "notifications");
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (kind !== "notifications") return;
    let active = true;
    setLoading(true);
    setLoadFailed(false);

    void hass.callWS<PersistentNotification[]>({ type: "persistent_notification/get" })
      .then((items) => {
        if (!active) return;
        setNotifications(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        if (!active) return;
        setNotifications([]);
        setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [hass, kind]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const submitAlarm = () => {
    if (!alarmEntity || pin.length < 4) return;
    const armed = alarmState && alarmState !== "disarmed";
    void hass.callService(
      "alarm_control_panel",
      armed ? "alarm_disarm" : "alarm_arm_away",
      { entity_id: alarmEntity, code: pin },
    );
    setPin("");
    onClose();
  };

  const themeClass = document.querySelector(".app-shell.night") ? "night" : "day";

  return createPortal(
    <div
      className={`fc-modal-backdrop ${themeClass}`}
      role="presentation"
      onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}
    >
      <section className={`fc-modal fc-${kind}-modal`} role="dialog" aria-modal="true" aria-label={kind === "alarm" ? copy.alarm : copy.notifications}>
        <div className="fc-modal-head">
          <div>
            <span>{copy.home}</span>
            <h2>{kind === "alarm" ? copy.alarm : copy.notifications}</h2>
          </div>
          <button type="button" className="fc-modal-close" onClick={onClose} aria-label={copy.close}><CloseIcon /></button>
        </div>

        {kind === "alarm" ? (
          <div className="fc-alarm-panel">
            <div className="fc-alarm-symbol"><ShieldIcon /></div>
            <div className="fc-alarm-copy">
              <strong>{alarmEntity ? (alarmState === "disarmed" ? copy.alarmReady : copy.alarmArmed) : copy.noAlarm}</strong>
              <span>{alarmEntity ? copy.alarmHint : copy.noAlarmHint}</span>
            </div>
            {alarmEntity && (
              <>
                <div className="fc-pin-dots" aria-label={copy.pin}>
                  {[0, 1, 2, 3].map((index) => <i className={index < pin.length ? "filled" : ""} key={index} />)}
                </div>
                <div className="fc-pin-grid">
                  {[1,2,3,4,5,6,7,8,9,"",0,"backspace"].map((key, index) => (
                    <button
                      type="button"
                      key={`${key}-${index}`}
                      disabled={key === ""}
                      onClick={() => {
                        if (key === "backspace") setPin((value) => value.slice(0, -1));
                        else if (key !== "") setPin((value) => value.length < 4 ? `${value}${key}` : value);
                      }}
                    >
                      {key === "backspace" ? <BackspaceIcon /> : key}
                    </button>
                  ))}
                </div>
                <button type="button" className="fc-primary-action" disabled={pin.length < 4} onClick={submitAlarm}>
                  {alarmState === "disarmed" ? copy.arm : copy.disarm}
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="fc-notification-panel">
            {loading && <div className="fc-modal-empty">{copy.loading}</div>}
            {!loading && loadFailed && <div className="fc-modal-empty">{copy.notificationsUnavailable}</div>}
            {!loading && !loadFailed && notifications.length === 0 && <div className="fc-modal-empty">{copy.noNotifications}</div>}
            {!loading && notifications.map((notification, index) => (
              <article className="fc-notification-row" key={notification.notification_id ?? `${notification.title}-${index}`}>
                <span className={`fc-notification-symbol ${notification.status === "unread" ? "unread" : ""}`}><BellIcon /></span>
                <div>
                  <strong>{notification.title || copy.notification}</strong>
                  <p>{notification.message || copy.noDetails}</p>
                  {notification.created_at && <small>{formatDate(notification.created_at, language)}</small>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>,
    document.body,
  );
}

function formatDate(value: string, language: Language) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(language === "it" ? "it-IT" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const itCopy = {
  home: "Casa",
  alarm: "Allarme",
  notifications: "Notifiche",
  close: "Chiudi",
  alarmReady: "Allarme pronto",
  alarmArmed: "Allarme inserito",
  alarmHint: "Inserisci il PIN per cambiare lo stato dell'allarme.",
  noAlarm: "Nessun allarme configurato",
  noAlarmHint: "Collega un alarm_control_panel in Home Assistant per usare questo controllo.",
  pin: "Codice PIN",
  arm: "Inserisci",
  disarm: "Disinserisci",
  loading: "Caricamento notifiche…",
  notificationsUnavailable: "Le notifiche di Home Assistant non sono disponibili.",
  noNotifications: "Nessuna notifica.",
  notification: "Notifica",
  noDetails: "Nessun dettaglio disponibile.",
};

const enCopy: typeof itCopy = {
  home: "Home",
  alarm: "Alarm",
  notifications: "Notifications",
  close: "Close",
  alarmReady: "Alarm ready",
  alarmArmed: "Alarm armed",
  alarmHint: "Enter the PIN to change the alarm state.",
  noAlarm: "No alarm configured",
  noAlarmHint: "Connect an alarm_control_panel in Home Assistant to use this control.",
  pin: "PIN code",
  arm: "Arm",
  disarm: "Disarm",
  loading: "Loading notifications…",
  notificationsUnavailable: "Home Assistant notifications are unavailable.",
  noNotifications: "No notifications.",
  notification: "Notification",
  noDetails: "No details available.",
};

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">{children}</svg>;
}
function CloseIcon() { return <Icon><path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></Icon>; }
function BellIcon() { return <Icon><path d="M6.7 16.8h10.6l-1.4-2V10a3.9 3.9 0 0 0-7.8 0v4.8ZM10.2 19h3.6" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" /></Icon>; }
function ShieldIcon() { return <Icon><><path d="M12 3.2 18.7 6v5c0 4.8-2.6 7.9-6.7 9.8C7.9 18.9 5.3 15.8 5.3 11V6Z" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round"/><path d="m9.2 12 1.7 1.7 3.9-3.9" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round"/></></Icon>; }
function BackspaceIcon() { return <Icon><><path d="m10 7-4 5 4 5h9V7Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="m13 10 4 4M17 10l-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></></Icon>; }
