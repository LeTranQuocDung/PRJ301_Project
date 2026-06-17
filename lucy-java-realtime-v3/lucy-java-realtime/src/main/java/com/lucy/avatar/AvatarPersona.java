package com.lucy.avatar;

/**
 * Avatar Persona — danh tính ẩn danh của người dùng trong phòng
 */
public class AvatarPersona {

    private final String avatarId;
    private final String personaName;
    private final String avatarEmoji;
    private final String identityColor;
    private final String role;          // "member" | "super"
    private boolean isMuted;
    private boolean isHandRaised;
    private final long joinedAt;
    private final String roomId;

    public AvatarPersona(String avatarId, String personaName, String avatarEmoji,
                         String identityColor, String role,
                         boolean isMuted, boolean isHandRaised,
                         long joinedAt, String roomId) {
        this.avatarId      = avatarId;
        this.personaName   = personaName;
        this.avatarEmoji   = avatarEmoji;
        this.identityColor = identityColor;
        this.role          = role;
        this.isMuted       = isMuted;
        this.isHandRaised  = isHandRaised;
        this.joinedAt      = joinedAt;
        this.roomId        = roomId;
    }

    // Getters
    public String getAvatarId()      { return avatarId; }
    public String getPersonaName()   { return personaName; }
    public String getAvatarEmoji()   { return avatarEmoji; }
    public String getIdentityColor() { return identityColor; }
    public String getRole()          { return role; }
    public boolean isMuted()         { return isMuted; }
    public boolean isHandRaised()    { return isHandRaised; }
    public long getJoinedAt()        { return joinedAt; }
    public String getRoomId()        { return roomId; }

    // Setters
    public void setMuted(boolean muted)           { this.isMuted = muted; }
    public void setHandRaised(boolean handRaised) { this.isHandRaised = handRaised; }

    public boolean isSuper() { return "super".equals(role); }
}
