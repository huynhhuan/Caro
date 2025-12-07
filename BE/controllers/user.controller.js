import User from "../models/User.js";

// Create user
export const createUser = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const exists = await User.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await User.create({
      name,
      avatar,
    });

    res.status(201).json({
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all users
export const getUsers = async (req, res) => {
  try {
    const list = await User.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get 1 user
export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update 1 user
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const { name, avatar, status, stats } = req.body;

    const updated = await User.findOneAndUpdate(
      { userId },
      {
        ...(name !== undefined && { name }),
        ...(avatar !== undefined && { avatar }),
        ...(status !== undefined && { status }),
        ...(stats !== undefined && { stats }),
      },
      {
        new: true,         
        runValidators: true,  
      }
    );

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};