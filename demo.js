const greet = (name) => {
  try {
    console.log("Greetings, " + name);
    console.log("Debug: greeting function called");
    console.log("New feature: enhanced logging");
    return "greeting sent";
  } catch (error) {
    console.error("Error in greeting:", error);
  }
};

const user = "world";
greet(user);