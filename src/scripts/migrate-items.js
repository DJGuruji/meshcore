const mongoose = require('mongoose');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/todo-app';

async function migrateItems() {
  try {
    console.log('Starting migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Define the Todo schema for migration
    const TodoSchema = new mongoose.Schema({
      title: String,
      items: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: String,
        notes: String,
        points: Number,
        links: [String],
        images: [String],
        targetDate: { type: Date },
        status: { 
          type: String, 
          enum: ['ETS', 'IN_PROGRESS', 'COMPLETED'], 
          default: 'ETS' 
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      }],
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      targetDate: { type: Date },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    
    const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
    
    // Find all todos
    const todos = await Todo.find({});
    console.log(`Found ${todos.length} todos to migrate`);
    
    let updatedTodos = 0;
    let updatedItems = 0;
    
    for (const todo of todos) {
      let todoUpdated = false;
      
      // Check if any items need migration
      for (const item of todo.items) {
        // Set status to 'ETS' if missing or null
        if (item.status === undefined || item.status === null) {
          item.status = 'ETS';
          console.log(`Setting status to 'ETS' for item ${item._id}`);
          todoUpdated = true;
          updatedItems++;
        }
        // Set targetDate to null if missing
        if (item.targetDate === undefined) {
          item.targetDate = null;
          console.log(`Setting targetDate to null for item ${item._id}`);
          todoUpdated = true;
          updatedItems++;
        }
      }
      
      if (todoUpdated) {
        await todo.save();
        updatedTodos++;
        console.log(`Updated todo ${todo._id} with ${todo.items.length} items`);
      }
    }
    
    console.log(`Migration completed!`);
    console.log(`Updated ${updatedTodos} todos`);
    console.log(`Updated ${updatedItems} items`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

// Run the migration
migrateItems(); 