import User from "../models/User.js";

// Create user
export const registerUser = async (req, res) => {
  try {
    const { name, avatar, pass } = req.body;

    if (!name || !pass) {
      return res.status(400).json({
        success: false,
        message: "Thiếu name hoặc pass",
      });
    }

    // Kiểm tra trùng tên
    const existing = await User.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Username đã tồn tại",
      });
    }

    const newUser = await User.create({
      name,
      avatar: avatar || "default.png",
      pass, // sau này nên hash password
    });

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản thành công",
      user: {
        _id: newUser._id,
        name: newUser.name,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    console.error("registerUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo user",
    });
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

export const loginUser = async (req, res) => {
  try {
    const { name, pass } = req.body;

    if (!name || !pass) {
      return res.status(400).json({
        success: false,
        message: "Thiếu name hoặc pass",
      });
    }

    const user = await User.findOne({ name, pass });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Sai username hoặc mật khẩu",
      });
    }

    return res.json({
      success: true,
      message: "Đăng nhập thành công",
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi login",
    });
  }
};
