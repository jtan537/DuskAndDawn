using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class IceSlidePlayerAudio : MonoBehaviour
{
    public float stepRate = 0.5f;
    public float slideCooldown;
    public int footStepInd;
    public float footStepVolume = 0.2f;

    PlayerController movement;
    // Start is called before the first frame update
    void Start()
    {
        movement = gameObject.GetComponent<PlayerController>();
    }

    // Update is called once per frame
    void Update()
    {
        slideCooldown -= Time.deltaTime;

        if (movement.playSlideSound && slideCooldown < 0f)
        {
            SoundManager.oneShotSoundFX(footStepInd, footStepVolume);
            slideCooldown = stepRate;
        }
    }
}
