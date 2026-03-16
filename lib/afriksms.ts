const AFRIKSMS_API_KEY = process.env.AFRIKSMS_API_KEY!
const AFRIKSMS_SENDER = process.env.AFRIKSMS_SENDER || 'AlafiyaPlus'

interface SMSResult {
  success: boolean
  message: string
}

export async function envoyerSMS(telephone: string, message: string): Promise<SMSResult> {
  try {
    const response = await fetch('https://api.afriksms.com/v1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AFRIKSMS_API_KEY}`,
      },
      body: JSON.stringify({
        sender: AFRIKSMS_SENDER,
        recipients: [telephone],
        message,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return { success: false, message: `Erreur AfrikSMS: ${err}` }
    }

    return { success: true, message: 'SMS envoyé avec succès' }
  } catch (err) {
    console.error('[AfrikSMS] Erreur:', err)
    return { success: false, message: 'Impossible d\'envoyer le SMS' }
  }
}

export function messageOTP(code: string, nomPatient: string): string {
  return `Alafiya Plus - Accès dossier médical de ${nomPatient}. Votre code d'accès : ${code}. Valable 10 minutes. Ne le communiquez à personne d'autre qu'au professionnel de santé présent.`
}

export function messageUrgence(
  nomPatient: string,
  nomMedecin: string,
  nomCentre: string,
  justification: string
): string {
  return `[ALAFIYA URGENCE] Le dossier médical de ${nomPatient} a été consulté en mode urgence par ${nomMedecin} (${nomCentre}). Motif : ${justification}. Contactez Alafiya Plus pour toute question.`
}
