import { Request, Response } from 'express';
import prisma from '../config/db';

// Système de recommandation de médecins basé sur des règles
export async function recommendDoctors(req: Request, res: Response) {
  try {
    const { symptoms, specialty, preferredTime, location } = req.body;

    // Récupérer tous les médecins avec leurs disponibilités et spécialités
    const medecins = await prisma.medecin.findMany({
      include: {
        user: true,
        specialite: true,
        availabilities: true,
      },
    });

    // Score chaque médecin en fonction des critères
    const scoredDoctors = medecins.map((medecin) => {
      let score = 0;
      const reasons: string[] = [];

      // 1. Correspondance de spécialité (poids: 40)
      if (specialty && medecin.specialite?.nom.toLowerCase() === specialty.toLowerCase()) {
        score += 40;
        reasons.push('Spécialité correspondante');
      } else if (medecin.specialite) {
        // Points partiels si spécialité différente mais dans le même domaine
        score += 10;
      }

      // 2. Correspondance de lieu (poids: 20)
      if (location && medecin.lieuConsultation) {
        if (medecin.lieuConsultation.toLowerCase().includes(location.toLowerCase())) {
          score += 20;
          reasons.push('Lieu proche');
        } else {
          score += 5;
        }
      }

      // 3. Disponibilité (poids: 30)
      if (medecin.availabilities.length > 0) {
        score += 30;
        reasons.push('Disponible');
      } else {
        score += 5;
      }

      // 4. Correspondance symptômes (poids: 10) - basé sur des mots-clés
      if (symptoms) {
        const symptomsLower = symptoms.toLowerCase();
        const specialtyName = medecin.specialite?.nom.toLowerCase() || '';
        
        // Mots-clés par spécialité
        const keywordMap: Record<string, string[]> = {
          'cardiologie': ['cœur', 'cardiaque', 'douleur thoracique', 'palpitations', 'essoufflement'],
          'dermatologie': ['peau', 'éruption', 'démangeaison', 'acné', 'bouton'],
          'pédiatrie': ['enfant', 'bébé', 'enfant', 'petit'],
          'généraliste': ['fièvre', 'fatigue', 'mal', 'douleur', 'général'],
          'ophtalmologie': ['œil', 'vue', 'vision', 'yeux'],
          'orthopédie': ['os', 'articulation', 'fracture', 'douleur articulaire'],
          'neurologie': ['tête', 'mal de tête', 'migraine', 'nerf'],
          'gynécologie': ['femme', 'grossesse', 'femme'],
        };

        for (const [spec, keywords] of Object.entries(keywordMap)) {
          if (specialtyName.includes(spec) && keywords.some(k => symptomsLower.includes(k))) {
            score += 10;
            reasons.push('Symptômes correspondants');
            break;
          }
        }
      }

      return {
        id: medecin.id,
        nom: medecin.user.nom,
        prenom: medecin.user.prenom,
        email: medecin.user.email,
        telephone: medecin.user.telephone,
        avatarUrl: medecin.user.avatarUrl,
        specialite: medecin.specialite,
        lieuConsultation: medecin.lieuConsultation,
        score,
        reasons,
        availabilities: medecin.availabilities,
      };
    });

    // Trier par score décroissant
    scoredDoctors.sort((a, b) => b.score - a.score);

    // Retourner les 5 meilleurs recommandations
    const recommendations = scoredDoctors.slice(0, 5);

    return res.json({
      recommendations,
      total: medecins.length,
      criteria: { symptoms, specialty, preferredTime, location },
    });
  } catch (error: any) {
    console.error('AI recommendation error:', error);
    return res.status(500).json({ message: 'Erreur lors de la génération des recommandations.', error: error.message });
  }
}

// Chatbot IA avec réponses prédéfinies
export async function chatbotQuery(req: Request, res: Response) {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message requis.' });
    }

    const messageLower = message.toLowerCase();

    // Base de connaissances du chatbot
    const responses: Array<{ keywords: string[]; response: string }> = [
      {
        keywords: ['bonjour', 'salut', 'hello', 'coucou'],
        response: 'Bonjour ! Je suis l\'assistant virtuel de MedAppoint. Comment puis-je vous aider aujourd\'hui ? Vous pouvez me demander de trouver un médecin, prendre rendez-vous, ou obtenir des informations sur nos services.',
      },
      {
        keywords: ['rendez-vous', 'rdv', 'prendre', 'réserver'],
        response: 'Pour prendre rendez-vous, vous pouvez : 1) Utiliser notre interface de recherche de médecins, 2) Filtrer par spécialité, 3) Choisir un créneau disponible. Voulez-vous que je vous guide vers la recherche de médecins ?',
      },
      {
        keywords: ['médecin', 'docteur', 'trouver', 'chercher'],
        response: 'Je peux vous aider à trouver le médecin adapté à vos besoins. Dites-moi : 1) Quelle spécialité vous intéresse ? 2) Avez-vous des symptômes spécifiques ? 3) Préférez-vous un lieu particulier ?',
      },
      {
        keywords: ['spécialité', 'spécialiste'],
        response: 'Nous proposons plusieurs spécialités : Cardiologie, Dermatologie, Pédiatrie, Généraliste, Ophtalmologie, Orthopédie, Neurologie, Gynécologie. Quelle spécialité vous intéresse ?',
      },
      {
        keywords: ['horaire', 'heure', 'disponible', 'quand'],
        response: 'Les horaires de disponibilité dépendent de chaque médecin. Vous pouvez consulter les créneaux disponibles directement sur la fiche de chaque médecin. Généralement, les consultations sont disponibles du lundi au vendredi de 9h à 17h.',
      },
      {
        keywords: ['prix', 'coût', 'tarif', 'combien'],
        response: 'Les tarifs des consultations varient selon les médecins et les spécialités. Les informations précises sont disponibles sur les profils des médecins. Certains médecins acceptent la carte vitale.',
      },
      {
        keywords: ['annuler', 'modifier', 'changer'],
        response: 'Vous pouvez annuler ou modifier un rendez-vous depuis votre espace personnel dans la section "Mes rendez-vous". Assurez-vous de le faire au moins 24h à l\'avance.',
      },
      {
        keywords: ['urgence', 'urgent', 'cas grave'],
        response: '⚠️ Pour une urgence médicale, composez le 15 (SAMU) ou le 112. Notre plateforme est destinée aux consultations non urgentes. Si votre situation est grave, contactez immédiatement les services d\'urgence.',
      },
      {
        keywords: ['contact', 'téléphone', 'email', 'aide'],
        response: 'Pour nous contacter : 📧 Email : support@medappoint.com 📞 Téléphone : 01 23 45 67 89 ⏰ Horaires : Lun-Ven 9h-18h',
      },
      {
        keywords: ['merci', 'ok', 'parfait'],
        response: 'Je vous en prie ! N\'hésitez pas si vous avez d\'autres questions. Je suis là pour vous aider.',
      },
    ];

    // Rechercher la meilleure réponse
    let bestMatch = null;
    let maxMatches = 0;

    for (const item of responses) {
      const matches = item.keywords.filter(k => messageLower.includes(k)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = item;
      }
    }

    // Réponse par défaut si pas de correspondance
    const defaultResponse = 'Je ne suis pas sûr de comprendre. Pouvez-vous reformuler votre question ? Je peux vous aider avec : la recherche de médecins, la prise de rendez-vous, les horaires, ou les informations de contact.';

    return res.json({
      response: bestMatch ? bestMatch.response : defaultResponse,
      confidence: bestMatch ? Math.min(maxMatches * 20, 100) : 0,
      suggestions: [
        'Trouver un médecin',
        'Prendre rendez-vous',
        'Horaires de consultation',
        'Annuler un rendez-vous',
      ],
    });
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return res.status(500).json({ message: 'Erreur du chatbot.', error: error.message });
  }
}

// Analyse de sentiment simple pour les feedbacks
export async function analyzeFeedback(req: Request, res: Response) {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      return res.status(400).json({ message: 'Feedback requis.' });
    }

    const feedbackLower = feedback.toLowerCase();

    // Mots-clés positifs et négatifs
    const positiveWords = ['bon', 'excellent', 'super', 'parfait', 'satisfait', 'content', 'rapide', 'efficace', 'professionnel', 'gentil'];
    const negativeWords = ['mauvais', 'nul', 'lent', 'désagréable', 'problème', 'erreur', 'difficile', 'compliqué', 'long', 'attente'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (feedbackLower.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (feedbackLower.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    let sentiment = 'NEUTRE';
    let score = 50;

    if (total > 0) {
      score = Math.round((positiveCount / total) * 100);
      if (score >= 60) sentiment = 'POSITIF';
      else if (score <= 40) sentiment = 'NÉGATIF';
    }

    return res.json({
      sentiment,
      score,
      positiveCount,
      negativeCount,
      feedback,
    });
  } catch (error: any) {
    console.error('Feedback analysis error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'analyse du feedback.', error: error.message });
  }
}

// Prise de RDV automatisée via IA avec compréhension du langage naturel
export async function automatedBooking(req: Request, res: Response) {
  try {
    const { message, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ message: 'Message et userId requis.' });
    }

    const messageLower = message.toLowerCase();

    // Extraction des informations du message en langage naturel
    let doctorName = null;
    let specialty = null;
    let preferredDay = null;
    let preferredTime = null;
    let symptoms = null;

    // Extraction du nom du médecin
    const doctorMatch = message.match(/(?:dr|docteur|médecin)\s+([a-z\s]+)/i);
    if (doctorMatch) {
      doctorName = doctorMatch[1].trim();
    }

    // Extraction de la spécialité
    const specialties = ['cardiologie', 'dermatologie', 'pédiatrie', 'généraliste', 'ophtalmologie', 'orthopédie', 'neurologie', 'gynécologie'];
    for (const spec of specialties) {
      if (messageLower.includes(spec)) {
        specialty = spec;
        break;
      }
    }

    // Extraction du jour (lundi, mardi, etc.)
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    for (const day of days) {
      if (messageLower.includes(day)) {
        preferredDay = day;
        break;
      }
    }

    // Extraction de l'heure (matin, après-midi, ou heure spécifique)
    if (messageLower.includes('matin')) {
      preferredTime = 'morning';
    } else if (messageLower.includes('après-midi') || messageLower.includes('aprem')) {
      preferredTime = 'afternoon';
    } else {
      const timeMatch = message.match(/(\d{1,2})h(\d{2})?/i);
      if (timeMatch) {
        preferredTime = timeMatch[0];
      }
    }

    // Extraction des symptômes (tout ce qui reste après avoir extrait les autres infos)
    symptoms = message.replace(/(?:dr|docteur|médecin)\s+[a-z\s]+/gi, '')
                      .replace(/(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)/gi, '')
                      .replace(/(?:matin|après-midi|aprem|\d{1,2}h\d{2})/gi, '')
                      .replace(/(?:pour|voir|besoin|rdv|rendez-vous)/gi, '')
                      .trim();

    // Rechercher les médecins correspondants
    const whereClause: any = {};
    if (specialty) {
      whereClause.specialite = {
        nom: {
          equals: specialty,
          mode: 'insensitive'
        }
      };
    } else if (doctorName) {
      whereClause.user = {
        OR: [
          { nom: { contains: doctorName, mode: 'insensitive' } },
          { prenom: { contains: doctorName, mode: 'insensitive' } }
        ]
      };
    }

    const doctors = await prisma.medecin.findMany({
      where: whereClause,
      include: {
        user: true,
        specialite: true,
        availabilities: true,
      },
    });

    if (doctors.length === 0) {
      return res.json({
        success: false,
        message: 'Aucun médecin trouvé correspondant à votre demande. Veuillez préciser la spécialité ou le nom du médecin.',
        extracted: { doctorName, specialty, preferredDay, preferredTime, symptoms }
      });
    }

    // Prendre le premier médecin correspondant
    const doctor = doctors[0];

    // Calculer la date et l'heure du rendez-vous
    let appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1); // Demain par défaut

    if (preferredDay) {
      const dayIndex = days.indexOf(preferredDay);
      const currentDay = appointmentDate.getDay();
      const daysUntil = (dayIndex + 7 - currentDay) % 7 || 7;
      appointmentDate.setDate(appointmentDate.getDate() + daysUntil);
    }

    let appointmentHour = 10; // 10h par défaut
    if (preferredTime === 'morning') {
      appointmentHour = 9;
    } else if (preferredTime === 'afternoon') {
      appointmentHour = 14;
    } else if (preferredTime && typeof preferredTime === 'string') {
      const hourMatch = preferredTime.match(/(\d{1,2})/);
      if (hourMatch) {
        appointmentHour = parseInt(hourMatch[1]);
      }
    }

    appointmentDate.setHours(appointmentHour, 0, 0, 0);

    // Créer le rendez-vous
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true }
    });

    if (!user || !user.patient) {
      return res.status(400).json({ message: 'Utilisateur ou patient non trouvé.' });
    }

    const appointment = await prisma.rendezVous.create({
      data: {
        patientId: user.patient.id,
        medecinId: doctor.id,
        dateHeureDebut: appointmentDate,
        dateHeureFin: new Date(appointmentDate.getTime() + 30 * 60 * 1000),
        motif: symptoms || 'Réservation via assistant IA',
        statut: 'EN_ATTENTE'
      }
    });

    return res.json({
      success: true,
      message: `Rendez-vous confirmé avec Dr. ${doctor.user.prenom} ${doctor.user.nom} le ${appointmentDate.toLocaleDateString('fr-FR')} à ${appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
      appointment: {
        id: appointment.id,
        doctor: `${doctor.user.prenom} ${doctor.user.nom}`,
        specialty: doctor.specialite?.nom,
        date: appointmentDate.toLocaleDateString('fr-FR'),
        time: appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        motif: symptoms
      },
      extracted: { doctorName, specialty, preferredDay, preferredTime, symptoms }
    });

  } catch (error: any) {
    console.error('Automated booking error:', error);
    return res.status(500).json({ message: 'Erreur lors de la réservation automatisée.', error: error.message });
  }
}

// Système anti no-show : envoi de rappels et confirmation
export async function sendNoShowReminder(req: Request, res: Response) {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: 'ID de rendez-vous requis.' });
    }

    const appointment = await prisma.rendezVous.findUnique({
      where: { id: appointmentId },
      include: {
        patient: {
          include: { user: true }
        },
        medecin: {
          include: { user: true }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Rendez-vous non trouvé.' });
    }

    const appointmentDate = new Date(appointment.dateHeureDebut);
    const now = new Date();
    const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 24 || hoursUntil < 0) {
      return res.json({
        success: false,
        message: 'Le rappel doit être envoyé 24h avant le rendez-vous.'
      });
    }

    // Simuler l'envoi d'un rappel (WhatsApp/SMS)
    const reminderMessage = `🔔 Rappel MedAppoint : Vous avez un rendez-vous avec Dr. ${appointment.medecin.user.prenom} ${appointment.medecin.user.nom} demain à ${appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Répondez OUI pour confirmer ou NON pour annuler.`;

    // Ici, vous intégreriez un service d'envoi de SMS/WhatsApp réel
    console.log('Sending reminder to patient:', appointment.patient.user.telephone);
    console.log('Message:', reminderMessage);

    return res.json({
      success: true,
      message: 'Rappel envoyé avec succès.',
      reminder: {
        sentTo: appointment.patient.user.telephone,
        message: reminderMessage,
        appointmentDate: appointmentDate.toLocaleDateString('fr-FR'),
        appointmentTime: appointmentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }
    });

  } catch (error: any) {
    console.error('No-show reminder error:', error);
    return res.status(500).json({ message: 'Erreur lors de l\'envoi du rappel.', error: error.message });
  }
}

// Confirmation de rendez-vous (réponse OUI/NON au rappel)
export async function confirmAppointmentReminder(req: Request, res: Response) {
  try {
    const { appointmentId, response } = req.body;

    if (!appointmentId || !response) {
      return res.status(400).json({ message: 'ID de rendez-vous et réponse requis.' });
    }

    if (response.toLowerCase() === 'non') {
      // Annuler le rendez-vous
      await prisma.rendezVous.update({
        where: { id: appointmentId },
        data: { statut: 'ANNULE' }
      });

      return res.json({
        success: true,
        message: 'Rendez-vous annulé suite à votre réponse.'
      });
    } else if (response.toLowerCase() === 'oui') {
      // Confirmer le rendez-vous
      await prisma.rendezVous.update({
        where: { id: appointmentId },
        data: { statut: 'VALIDE' }
      });

      return res.json({
        success: true,
        message: 'Rendez-vous confirmé. À demain !'
      });
    } else {
      return res.status(400).json({ message: 'Réponse invalide. Utilisez OUI ou NON.' });
    }

  } catch (error: any) {
    console.error('Appointment confirmation error:', error);
    return res.status(500).json({ message: 'Erreur lors de la confirmation.', error: error.message });
  }
}
