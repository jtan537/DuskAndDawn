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

    Metadata _metadata;

    Audio _dawnBGM, _duskBGM;
    int _dawnBGMId, _duskBGMId;

    [SerializeField]
    bool adaptiveMusic = false;

    static int backgroundMusicID = 0;
    // Start is called before the first frame update
    void Start()
    {
        _metadata = GameObject.FindObjectOfType<Metadata>();
        EazySoundManager.GlobalMusicVolume = volume;
        _soundManager = GameObject.Find("SoundManager").GetComponent<SoundManager>();
        _dawnBGMId = EazySoundManager.PrepareMusic(_soundManager.backgroundMusic[0], 0.5f, true, false, 1, 1);
        _duskBGMId = EazySoundManager.PrepareMusic(_soundManager.backgroundMusic[1], 0.5f, true, false, 1, 1);

        if (adaptiveMusic)
        {
            EazySoundManager.GetAudio(_dawnBGMId).Play();
            EazySoundManager.GetAudio(_duskBGMId).Play();
        } else
        {
            EazySoundManager.GetAudio(_dawnBGMId).Play();
        }
        
    }

    private void Update()
    {
        if (adaptiveMusic)
        {
            if (_metadata.curPlayer.name == "Dawn")
            {
                EazySoundManager.GetAudio(_dawnBGMId).SetVolume(volume);
                EazySoundManager.GetAudio(_duskBGMId).SetVolume(0);
            }
            else
            {
                EazySoundManager.GetAudio(_dawnBGMId).SetVolume(0);
                EazySoundManager.GetAudio(_duskBGMId).SetVolume(volume);
            }
        }
        
        EazySoundManager.GlobalMusicVolume = volume;
    }


    public static void oneShotSoundFX(int index, float volume)
    {
        EazySoundManager.PlaySound(_soundManager.soundEffects[index], volume, false, null);
    }



}
