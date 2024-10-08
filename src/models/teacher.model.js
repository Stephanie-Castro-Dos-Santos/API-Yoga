import mongoose from "mongoose";
//import User from "./user.model";
const { ObjectId } = mongoose.Schema;

const TeacherSchema = mongoose.Schema({
  user: {
    type: ObjectId,
    ref: "User",
    required: true,
  },

  // calendars: [
  //   {
  //     type: ObjectId,
  //     ref: "Calendar",
  //   },
  // ],

  // level: {
  //   type: String,
  //   enum: ["N1", "N2", "N3"],
  //   required: true,
  // },

  // certificate: {
  //   name: {
  //     type: String,
  //     required: true,
  //   },

  //   entity: {
  //     type: String,
  //     required: true,
  //   },

  //   seal: {
  //     type: String,
  //     required: true,
  //   },

  //   validation: {
  //     type: ["yes" | "no"],
  //   },
  // },

  // description: {
  //   type: String,
  //   required: false,
  // },

  // center: {
  //   type: ObjectId,
  //   ref: "Center",
  // },

  //styles: {
  // type: Array
  //}
});

export const Teacher = mongoose.model("Teacher", TeacherSchema);
