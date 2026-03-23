import mongoose from 'mongoose';

const cacheSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['llm', 'rag'],
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index
  },
}, { timestamps: true });

const Cache = mongoose.model('Cache', cacheSchema);

export default Cache;
