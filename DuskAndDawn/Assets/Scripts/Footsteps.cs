using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Footsteps : MonoBehaviour
{
	public float stepRate = 0.5f;
	public float stepCoolDown;
	public int footStepInd;
	public float volume = 0.2f, topRange = 0.01f, bottomRange = -0.025f;

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
			SoundManager.oneShotSoundFX(footStepInd, volume + Random.Range(bottomRange, topRange));
			stepCoolDown = stepRate;
		}
	}
}