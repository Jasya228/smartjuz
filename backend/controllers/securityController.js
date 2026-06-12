import db from '../db/jsonStore.js';

const Threat = db.getCollection('threats');

// @desc    Log a security threat (unknown face)
// @route   POST /api/security/threats
// @access  Private
export const logThreat = async (req, res) => {
  const { image } = req.body;

  try {
    const threat = Threat.create({
      image
    });

    // Send Telegram Notification to everyone
    import('../utils/telegramBot.js').then(bot => {
      bot.broadcastPhoto(
        image, 
        `🚨 <b>ВНИМАНИЕ!</b>\nОбнаружено неизвестное лицо пытающееся пройти сканирование.\n\n🕒 Время: ${new Date().toLocaleString('ru-RU')}`
      );
    });

    res.status(201).json(threat);
  } catch (error) {
    console.error('Threat Log Error:', error);
    res.status(400).json({ message: 'Invalid threat data' });
  }
};

// @desc    Get all threats
// @route   GET /api/security/threats
// @access  Private
export const getThreats = async (req, res) => {
  try {
    const records = Threat.find({});
    const sortedRecords = Threat.sort(records, { createdAt: -1 });
    res.json(sortedRecords);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a threat
// @route   DELETE /api/security/threats/:id
// @access  Private
export const deleteThreat = async (req, res) => {
  try {
    const threat = Threat.findById(req.params.id);
    if (threat) {
      Threat.deleteById(req.params.id);
      res.json({ message: 'Threat removed' });
    } else {
      res.status(404).json({ message: 'Threat not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
