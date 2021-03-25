using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;

[CreateAssetMenu(menuName = "Dialog/Speaker")]
public class SpeakerData : ScriptableObject
{
	public const string EMOTION_NEUTRAL = "neutral";
	public const string EMOTION_SAD = "sad";
    public const string EMOTION_HAPPY = "happy";
    // Dawn & Dusk
    public const string EMOTION_PLAYFUL = "playful";
    // Dusk
    public const string EMOTION_FRUSTRATED = "frustrated";
    // Rat
    public const string EMOTION_SIGH = "sigh";
    // Frog
    public const string EMOTION_SMUG = "smug";
    // Tree
    public const string EMOTION_WITH_LEAVES = "with_leaves";
    public const string EMOTION_SHOCKED = "shocked";
    // Cat
    public const string EMOTION_SURPRISED = "surprised";
    public const string EMOTION_THANKFUL = "thankful";
    public const string EMOTION_THINKING = "thinking";

    public string speakerName;
    public Sprite portraitNeutral, portraitSad, portraitHappy, portraitPlayful, portraitFrustrated, portraitSigh, portraitSmug, portraitWithLeaves, portraitShocked, portraitSurprised, portraitThankful, portraitThinking;

    public Sprite GetEmotionPortrait(string emotion)
    {
    	switch (emotion)
    	{
    		default:
    		case EMOTION_NEUTRAL: return portraitNeutral;
            case EMOTION_SAD: return portraitSad;
            case EMOTION_HAPPY: return portraitHappy;
    		case EMOTION_PLAYFUL: return portraitPlayful;
            case EMOTION_FRUSTRATED: return portraitFrustrated;
            case EMOTION_SIGH: return portraitSigh;
            case EMOTION_SMUG: return portraitSmug;
    		case EMOTION_WITH_LEAVES: return portraitWithLeaves;
            case EMOTION_SHOCKED: return portraitShocked;
            case EMOTION_SURPRISED: return portraitSurprised;
            case EMOTION_THANKFUL: return portraitThankful;
            case EMOTION_THINKING: return portraitThinking;
    	}
    }
}
