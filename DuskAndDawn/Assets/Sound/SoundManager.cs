using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Hellmade.Sound;

public class SoundManager : MonoBehaviour
{
    [SerializeField]
    List<AudioClip> soundEffects , backgroundMusic ;

    [Range(0,1)]
    public float volume;
    static SoundManager _soundManager;

    static int backgroundMusicID = 0;
    // Start is called before the first frame update
    void Start()
    {
        EazySoundManager.GlobalMusicVolume = volume;
        _soundManager = GameObject.Find("SoundManager").GetComponent<SoundManager>();
        playBackgroundMusic(0);
    }

    private void Update()
    {
        EazySoundManager.GlobalMusicVolume = volume;
    }

    public static void playBackgroundMusic(int index)
    {
        backgroundMusicID = EazySoundManager.PlayMusic(_soundManager.backgroundMusic[index], 0.5f, true, false, 1, 1);
    }

    public static void oneShotSoundFX(int index, float volume)
    {
        EazySoundManager.PlaySound(_soundManager.soundEffects[index], volume, false, null);
    }

}
