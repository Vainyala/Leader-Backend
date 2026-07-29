const jwt = require("jsonwebtoken");

const LeaderSplashMsgAnnouncement = require("../models/LeaderSplashMsgAnnouncement");
const mediaCorner = require("../models/mediaCorner");
const User = require("../models/User");
const logger = require("../utils/logger");

exports.recordSplashClick = async (req, res) => {
    const requestId = req.requestId || "N/A";

    try {

        const { media_corner_id, lat, long } = req.body;

        if (!media_corner_id || lat === undefined || long === undefined) {
            return res.status(400).json({
                message: "recordSplashClick :-> Missing params, check and try again"
            });
        }

        // ============================
        // Decode JWT directly
        // ============================

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Missing or invalid token"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded Token:", decoded);
        

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                error: "User not found"
            });
        }

        // ============================

        const mediaRecord = await mediaCorner.findById(media_corner_id);

        if (!mediaRecord) {
            return res.status(404).json({
                error: "Media Corner record not found"
            });
        }

        if (mediaRecord.media_type !== "LN") {
            return res.status(400).json({
                message: "Only Latest News accepts responses."
            });
        }

        if (mediaRecord.user_input !== "Yes") {
            return res.status(400).json({
                message: "Responses are disabled for this announcement."
            });
        }

        const alreadyResponded =
            await LeaderSplashMsgAnnouncement.findOne({
                media_corner_id,
                user_id: user._id
            });

        if (alreadyResponded) {
            return res.status(409).json({
                message: "You have already responded."
            });
        }

        const click = await LeaderSplashMsgAnnouncement.create({

            leader_regd_mobile_no: decoded.leader_regd_mobile_no,

            media_corner_id: mediaRecord._id,

            user_id: user._id,

            user_email_id: decoded.user_email_id || decoded.email,

            user_mobile_no: user.mobile,

            name: user.name,

            profile_image: user.profile_image,

            address: user.address,

            city: user.city,

            district: user.district,

            state: user.state,

            pincode: user.pincode,

            button_text:
                mediaRecord.custom_text || "Click to Continue",

            location: {
                lat,
                long
            }

        });
console.log("Email from token:", decoded.email);
        logger.info(
            `[${requestId}] Splash click recorded for user ${user._id} on media ${media_corner_id}`
        );

        return res.status(201).json({
            message: "Response recorded",
            id: click._id
        });

    } catch (err) {

        logger.error(`[${requestId}] recordSplashClick error: ${err.message}`);

        return res.status(500).json({
            error: "Failed to record response"
        });

    }
};

exports.getSplashAnnouncements = async (req, res, next) => {
    const requestId = req.requestId || 'N/A';
    try {
        if (req.user_type === 'user') {
            return res.status(403).json({ status: 'error', message: 'Alert! Action forbidden' });
        }

        const { from_date, to_date, media_corner_id, leader_regd_mobile_no } = req.query;
        const filter = {};

        if (leader_regd_mobile_no) filter.leader_regd_mobile_no = leader_regd_mobile_no;
        if (media_corner_id) filter.media_corner_id = media_corner_id;

        if (from_date || to_date) {
            filter.createdAt = {};
            if (from_date) filter.createdAt.$gte = new Date(`${from_date}T00:00:00`);
            if (to_date) filter.createdAt.$lte = new Date(`${to_date}T23:59:59`);
        }
        // No date at all -> filter.createdAt stays unset -> returns ALL records, unfiltered by date

        const records =
            await LeaderSplashMsgAnnouncement.find(filter)

                .populate(
                    "media_corner_id",
                    "media_header media_type custom_text media_file"
                )

                .sort({

                    createdAt: -1

                });
        const totalResponses =
            await LeaderSplashMsgAnnouncement.countDocuments(filter);
        logger.info(`[${requestId}] ${records.length} splash announcement records fetched`);
        return res.status(200).json({ total: totalResponses, data: records });
    } catch (err) {
        logger.error(`[${requestId}] getSplashAnnouncements error: ${err.message}`);
        return next(err);
    }
};