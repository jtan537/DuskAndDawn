using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerAudioControl : MonoBehaviour
{
	public float stepRate = 0.5f;
	public float stepCoolDown;
	public int footStepInd, jumpStepInd = 5;
	public float footStepVolume = 0.2f, topRange = 0.01f, bottomRange = -0.025f, jumpVolume = 0.1f;

	ThreeDMovement movement;

    private void Start()
    {
		movement = gameObject.GetComponent<ThreeDMovement>();
    }


    // Update is called once per frame
    void Update()
	{
		stepCoolDown -= Time.deltaTime;
		if (movement.playWalkSound &&  stepCoolDown < 0f)
		{
			SoundManager.oneShotSoundFX(footStepInd, footStepVolume + Random.Range(bottomRange, topRange));
			stepCoolDown = stepRate;
		}

		if (movement.playJumpSound)
        {
			SoundManager.oneShotSoundFX(jumpStepInd, jumpVolume);
			movement.playJumpSound = false;
		}
	}
}